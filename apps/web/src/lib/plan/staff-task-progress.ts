export type StaffPlanTaskProgress = {
  overdue: number;
  pending: number;
  blocked: number;
};

type ProgressTask = {
  status: string;
  due_date: string | null;
};

type ProgressWeek = {
  start_date: string;
  end_date: string;
};

/**
 * Overdue: due before the current plan week and not Done.
 * Pending: due this week and Not started.
 * Blocked: due this week and Blocked.
 */
export function computeStaffTaskProgress(
  tasks: ProgressTask[],
  weeks: ProgressWeek[],
  today = new Date().toISOString().slice(0, 10),
): StaffPlanTaskProgress {
  const currentWeek =
    weeks.find((week) => week.start_date <= today && today <= week.end_date) ??
    null;

  let overdue = 0;
  let pending = 0;
  let blocked = 0;

  for (const task of tasks) {
    if (!task.due_date) {
      continue;
    }

    if (currentWeek) {
      if (task.due_date < currentWeek.start_date && task.status !== "done") {
        overdue += 1;
      }

      if (
        task.due_date >= currentWeek.start_date &&
        task.due_date <= currentWeek.end_date
      ) {
        if (task.status === "not_started") {
          pending += 1;
        }
        if (task.status === "blocked") {
          blocked += 1;
        }
      }
    } else if (task.due_date < today && task.status !== "done") {
      overdue += 1;
    }
  }

  return { overdue, pending, blocked };
}
