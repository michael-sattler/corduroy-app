import type {
  Kpi,
  Milestone,
  Participant,
  Phase,
  PlanDocument,
  PlanWeek,
  Task,
  TaskView,
} from "@/lib/plan/types";

const THEME_COLORS = ["theme-red", "theme-blue", "theme-green", "theme-purple"] as const;

const MS_PER_DAY = 86_400_000;

export function parsePlanDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayTab(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatPeriodLabel(start: string, end: string): string {
  const s = parsePlanDate(start);
  const e = parsePlanDate(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const startFmt = s.toLocaleDateString("en-US", {
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endFmt = e.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return `${startFmt} – ${endFmt}`;
}

function compareIso(a: string, b: string): number {
  return a.localeCompare(b);
}

function isTaskDone(task: Task): boolean {
  return task.current_status === "done";
}

function isTaskInProgress(task: Task): boolean {
  return (
    task.current_status === "in_progress" ||
    (task.current_pct_complete > 0 && !isTaskDone(task))
  );
}

export function participantInitials(
  participantId: string,
  participants: Participant[],
): string {
  const person = participants.find((p) => p.id === participantId);
  if (!person) return "??";
  const parts = person.display_name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function phaseThemeColor(index: number): string {
  return THEME_COLORS[index % THEME_COLORS.length];
}

export function buildPlanWeeks(
  doc: PlanDocument,
  today = new Date(),
): PlanWeek[] {
  const start = parsePlanDate(doc.plan.period_start);
  const end = parsePlanDate(doc.plan.period_end);
  const todayIso = formatIso(today);
  const totalWeeks = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime() + MS_PER_DAY) / (7 * MS_PER_DAY)),
  );

  const weeks: PlanWeek[] = [];

  for (let i = 0; i < totalWeeks; i++) {
    const weekStart = addDays(start, i * 7);
    const weekEnd = addDays(weekStart, 6);
    const weekNum = i + 1;
    const weekTasks = doc.tasks.filter((task) =>
      taskOverlapsWeek(task, weekStart, weekEnd),
    );
    const doneCount = weekTasks.filter(isTaskDone).length;
    const progress =
      weekTasks.length === 0
        ? 0
        : Math.round((doneCount / weekTasks.length) * 100);

    const startIso = formatIso(weekStart);
    const endIso = formatIso(weekEnd);

    let status: PlanWeek["status"] = "upcoming";
    if (compareIso(todayIso, endIso) > 0) {
      status = "complete";
    } else if (compareIso(todayIso, startIso) >= 0 && compareIso(todayIso, endIso) <= 0) {
      status = "active";
    }

    weeks.push({
      week: weekNum,
      label: `Week ${weekNum}`,
      range: `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}`,
      startDate: startIso,
      endDate: endIso,
      progress,
      status,
    });
  }

  return weeks;
}

function taskOverlapsWeek(task: Task, weekStart: Date, weekEnd: Date): boolean {
  const startIso = formatIso(weekStart);
  const endIso = formatIso(weekEnd);
  return (
    compareIso(task.start_date, endIso) <= 0 &&
    compareIso(task.due_date, startIso) >= 0
  );
}

export function defaultWeekIndex(weeks: PlanWeek[]): number {
  const active = weeks.findIndex((w) => w.status === "active");
  if (active >= 0) return active;
  const firstUpcoming = weeks.findIndex((w) => w.status === "upcoming");
  if (firstUpcoming >= 0) return firstUpcoming;
  return Math.max(0, weeks.length - 1);
}

export function workdaysInWeek(week: PlanWeek): Date[] {
  const start = parsePlanDate(week.startDate);
  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    days.push(addDays(start, i));
  }
  return days;
}

export function defaultDayIndex(days: Date[], today = new Date()): number {
  const todayIso = formatIso(today);
  const match = days.findIndex((d) => formatIso(d) === todayIso);
  if (match >= 0) return match;
  return 0;
}

export function phaseForWeek(weekNum: number, phases: Phase[]): Phase | undefined {
  return phases.find((p) => weekNum >= p.week_start && weekNum <= p.week_end);
}

export function milestonesForWeek(
  week: PlanWeek,
  milestones: Milestone[],
  phase?: Phase,
): Milestone[] {
  const inRange = milestones.filter(
    (m) =>
      compareIso(m.due_date, week.startDate) >= 0 &&
      compareIso(m.due_date, week.endDate) <= 0,
  );
  if (inRange.length > 0) return inRange;
  if (phase) {
    return milestones.filter((m) => m.phase_id === phase.id);
  }
  return milestones.slice(0, 5);
}

export function milestoneTone(
  milestone: Milestone,
): "success" | "purple" | "warning" | "muted" {
  if (
    milestone.current_status === "achieved" ||
    milestone.current_pct_complete >= 100
  ) {
    return "success";
  }
  if (milestone.current_status === "at_risk") return "warning";
  if (
    milestone.current_status === "in_progress" ||
    milestone.current_pct_complete > 0
  ) {
    return "purple";
  }
  return "muted";
}

export function groupTasksForDay(
  doc: PlanDocument,
  week: PlanWeek,
  dayIso: string,
): {
  dueToday: TaskView[];
  inProgress: TaskView[];
  completed: TaskView[];
} {
  const weekTasks = doc.tasks.filter((task) =>
    taskOverlapsWeek(task, parsePlanDate(week.startDate), parsePlanDate(week.endDate)),
  );

  const dueToday: TaskView[] = [];
  const inProgress: TaskView[] = [];
  const completed: TaskView[] = [];

  for (const task of weekTasks) {
    const view = toTaskView(task, doc.participants);

    if (isTaskDone(task)) {
      completed.push(view);
      continue;
    }

    if (isTaskInProgress(task)) {
      inProgress.push(view);
      continue;
    }

    if (compareIso(task.due_date, dayIso) <= 0) {
      dueToday.push({
        ...view,
        overdue: compareIso(task.due_date, dayIso) < 0,
      });
      continue;
    }

    if (compareIso(task.start_date, dayIso) <= 0) {
      inProgress.push(view);
    }
  }

  return { dueToday, inProgress, completed };
}

function toTaskView(task: Task, participants: Participant[]): TaskView {
  const accent =
    task.class === "meeting"
      ? "accent-purple"
      : task.class === "deliverable"
        ? "accent-blue"
        : "accent-red";

  const note = [task.description, task.notes].filter(Boolean).join(" · ");

  return {
    id: task.id,
    title: task.name,
    tag: task.class.charAt(0).toUpperCase() + task.class.slice(1),
    note,
    assignee: participantInitials(task.assignee_id, participants),
    accent,
  };
}

export function formatKpiValue(kpi: Kpi): string {
  if (kpi.unit === "$") {
    return kpi.current_value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
  if (kpi.unit === "%") {
    return `${kpi.current_value}%`;
  }
  return `${kpi.current_value} ${kpi.unit}`;
}

export function formatKpiTarget(kpi: Kpi): string {
  if (kpi.unit === "$") {
    return kpi.target_value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
  if (kpi.unit === "%") {
    return `${kpi.target_value}%`;
  }
  return `${kpi.target_value} ${kpi.unit}`;
}

export function kpiProgressPct(kpi: Kpi): number {
  const { initial_value, current_value, target_value } = kpi;
  if (target_value === initial_value) {
    return current_value >= target_value ? 100 : 0;
  }
  const pct =
    ((current_value - initial_value) / (target_value - initial_value)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function planStatusLabel(doc: PlanDocument, week: PlanWeek): string {
  const atRisk = doc.milestones.some((m) => m.current_status === "at_risk");
  if (atRisk) return "Needs attention";
  if (week.status === "complete") return "Complete";
  return "On track";
}

export function remainingTaskCount(doc: PlanDocument): number {
  return doc.tasks.filter((t) => !isTaskDone(t)).length;
}

export {
  formatDayTab,
  formatIso,
  formatPeriodLabel,
  formatShortDate,
};
