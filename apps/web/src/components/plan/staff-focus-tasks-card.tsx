"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faListCheck,
} from "@/lib/fontawesome-icons";
import {
  planStatusTone,
  taskStatusLabel,
} from "@/lib/plan/staff-plan-dashboard-format";
import type {
  StaffPlanDashboardTask,
  StaffPlanFocusWeek,
} from "@/lib/plan/staff-plan-dashboard-types";

type StaffFocusTasksCardProps = {
  weeks: StaffPlanFocusWeek[];
  fallbackTasks: StaffPlanDashboardTask[];
  onManage: () => void;
};

function pickDefaultWeekId(weeks: StaffPlanFocusWeek[]): string | null {
  if (weeks.length === 0) return null;
  const current = weeks.find((week) => week.is_current);
  if (current) return current.id;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = weeks.find((week) => week.start_date >= today);
  if (upcoming) return upcoming.id;

  return weeks[weeks.length - 1]?.id ?? null;
}

function openTaskCount(tasks: StaffPlanDashboardTask[]): number {
  return tasks.filter(
    (task) => task.status !== "done" && task.status !== "skipped",
  ).length;
}

export function StaffFocusTasksCard({
  weeks,
  fallbackTasks,
  onManage,
}: StaffFocusTasksCardProps) {
  const [activeWeekId, setActiveWeekId] = useState<string | null>(() =>
    pickDefaultWeekId(weeks),
  );
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "left",
  );
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const currentWeek = weeks.find((week) => week.is_current) ?? null;

  useEffect(() => {
    setActiveWeekId((current) => {
      if (current && weeks.some((week) => week.id === current)) {
        return current;
      }
      return pickDefaultWeekId(weeks);
    });
  }, [weeks]);

  function updateScrollAffordances() {
    const scroller = tabsRef.current;
    if (!scroller) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    setCanScrollLeft(scroller.scrollLeft > 2);
    setCanScrollRight(scroller.scrollLeft < maxScroll - 2);
  }

  useLayoutEffect(() => {
    const tab = activeTabRef.current;
    const scroller = tabsRef.current;
    if (tab && scroller) {
      const delta =
        tab.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
      scroller.scrollBy({
        left: delta,
        behavior: "smooth",
      });
    }
    updateScrollAffordances();
  }, [activeWeekId, weeks]);

  useEffect(() => {
    const scroller = tabsRef.current;
    if (!scroller) return;

    updateScrollAffordances();
    scroller.addEventListener("scroll", updateScrollAffordances, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollAffordances);

    return () => {
      scroller.removeEventListener("scroll", updateScrollAffordances);
      window.removeEventListener("resize", updateScrollAffordances);
    };
  }, [weeks]);

  const activeIndex = weeks.findIndex((week) => week.id === activeWeekId);
  const activeWeek = activeIndex >= 0 ? weeks[activeIndex] : null;
  const shownTasks = activeWeek?.tasks ?? fallbackTasks;
  const openCount = activeWeek
    ? openTaskCount(activeWeek.tasks)
    : fallbackTasks.length;
  const isOnCurrentWeek =
    currentWeek !== null && currentWeek.id === activeWeekId;

  function selectWeek(weekId: string) {
    const nextIndex = weeks.findIndex((week) => week.id === weekId);
    if (nextIndex < 0 || weekId === activeWeekId) return;

    setSlideDirection(nextIndex > activeIndex ? "left" : "right");
    setActiveWeekId(weekId);
  }

  function scrollTabs(direction: "left" | "right") {
    const scroller = tabsRef.current;
    if (!scroller) return;
    const delta = Math.max(160, Math.round(scroller.clientWidth * 0.7));
    scroller.scrollBy({
      left: direction === "left" ? -delta : delta,
      behavior: "smooth",
    });
  }

  return (
    <div className="app-card staff-dashboard-panel h-100 staff-focus-tasks-card">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="staff-section-heading mb-0">Focus tasks</h3>
        <div className="d-flex align-items-center gap-2">
          <span className="staff-dashboard-muted">
            {openCount} open
            {activeWeek ? ` · ${activeWeek.tasks.length} this week` : ""}
          </span>
          {currentWeek ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => selectWeek(currentWeek.id)}
              disabled={isOnCurrentWeek}
              title="Jump to the current week"
            >
              Current Week
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
            onClick={onManage}
            title="Manage tasks"
            aria-label="Manage tasks"
          >
            <FontAwesomeIcon icon={faListCheck} />
            Manage
          </button>
        </div>
      </div>

      {weeks.length > 0 ? (
        <div className="staff-focus-week-tabs-wrap">
          <button
            type="button"
            className="staff-focus-week-scroll"
            onClick={() => scrollTabs("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll weeks left"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <div
            ref={tabsRef}
            className="staff-focus-week-tabs"
            role="tablist"
            aria-label="Plan weeks"
          >
            {weeks.map((week) => {
              const selected = week.id === activeWeekId;
              return (
                <button
                  key={week.id}
                  ref={selected ? activeTabRef : undefined}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`staff-focus-week-tab${selected ? " is-active" : ""}${
                    week.is_current ? " is-current" : ""
                  }`}
                  onClick={() => selectWeek(week.id)}
                >
                  {week.label}
                  {week.is_current ? (
                    <span className="staff-focus-week-current-mark">Now</span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="staff-focus-week-scroll"
            onClick={() => scrollTabs("right")}
            disabled={!canScrollRight}
            aria-label="Scroll weeks right"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      ) : null}

      <div className="staff-focus-tasks-viewport">
        <div
          key={activeWeek?.id ?? "fallback"}
          className={`staff-focus-tasks-slide staff-focus-tasks-slide--${slideDirection}`}
        >
          <div className="staff-milestone-list">
            {shownTasks.length === 0 ? (
              <p className="staff-dashboard-muted mb-0">
                No tasks scheduled for this week.
              </p>
            ) : (
              shownTasks.map((task, index) => (
                <div key={task.task_id} className="staff-action-row">
                  <span className="staff-action-num">{index + 1}</span>
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-medium text-truncate">{task.label}</div>
                    <div className="small text-body-secondary text-truncate">
                      {task.category} · {task.owner}
                    </div>
                  </div>
                  <span
                    className={`badge staff-action-badge ${planStatusTone(task.status)}`}
                  >
                    {taskStatusLabel(task.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
