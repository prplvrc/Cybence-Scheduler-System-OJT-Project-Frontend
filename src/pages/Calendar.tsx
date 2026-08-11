﻿import { useState } from "react";
import { Plus, Clock, Calendar as Filter } from "lucide-react";
import "./Calendar.css";
import NewTaskModal from "./New_Task";
import type { NewTaskFormData } from "./New_Task";
import type { Task } from "./Task_Board";
import { createTask as createTaskApi } from "../api/task.api";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const normalizeName = (value: unknown): string => {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === "string") return name.trim().toLowerCase();
  }
  return "";
};

type CalendarProps = {
  tasks?: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  currentUserName?: string;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function Calendar({
  tasks = [],
  onTasksChange = () => undefined,
  currentUserName = "User",
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  void onTasksChange;

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyOffset = Array.from({ length: firstDayOfMonth });
  const today = new Date();

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(1);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now.getDate());
  };

  // 1. Filter tasks belonging to the user for the active month
  const ownerTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    if (Number.isNaN(dueDate.getTime())) return false;

    const assignedUserName = task.assignee?.name ?? "";
    const isUserTask =
      normalizeName(assignedUserName) === normalizeName(currentUserName);

    if (!isUserTask) return false;

    if (
      dueDate.getMonth() !== currentMonth ||
      dueDate.getFullYear() !== currentYear
    ) {
      return false;
    }

    // Filter View Handling
    if (activeFilter === "All") return true;

    if (activeFilter === "Pending") {
      return (
        task.status === "Pending" ||
        task.status === "To Do" ||
        task.status === "To Be Assigned"
      );
    }

    return task.status === activeFilter;
  });

  // 2. Selected day tasks
  const selectedDayTasks = ownerTasks.filter((task) => {
    const dueDate = new Date(task.dueDate!);
    return dueDate.getDate() === selectedDay;
  });

  // 3. Dynamic Upcoming Tasks (tasks with due dates starting today or in the future)
  const upcomingTasks = tasks
    .filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const isUserTask =
        normalizeName(task.assignee?.name) === normalizeName(currentUserName);

      return isUserTask && dueDate >= startOfToday && task.status !== "Completed";
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 4);

  // Monthly statistics calculation
  const totalMonthTasks = ownerTasks.length;
  const completedMonthTasks = ownerTasks.filter((t) => t.status === "Completed").length;
  const completionPercentage =
    totalMonthTasks > 0 ? Math.round((completedMonthTasks / totalMonthTasks) * 100) : 0;

  const handleCreateTask = async (taskData: NewTaskFormData) => {
    try {
      const isOpenForAnyone = taskData.assignTo === "Open for anyone to take";

      await createTaskApi({
        title: taskData.title,
        description: taskData.description,
        status: isOpenForAnyone ? "To Be Assigned" : taskData.status || "To Do",
        priority: taskData.priority || "Medium",
        dueDate: taskData.dueDate || null,
        assignedTo: isOpenForAnyone ? null : Number(taskData.assignTo),
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Failed to create task.");
    }
  };

  return (
    <div className="calendar-view">
      {/* HEADER */}
      <header className="page-header">
        <div className="title-group">
          <h1>Calendar</h1>
          <p className="subtitle">
            Track and manage all your assigned tasks across the month
          </p>
        </div>

        <button
          className="btn-primary flex items-center gap-2 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          Add New Task
        </button>
      </header>

      {/* 2-COLUMN MAIN LAYOUT */}
      <div className="calendar-main-layout">
        {/* LEFT COLUMN: CALENDAR GRID */}
        <div className="calendar-card">
          <div className="month-header">
            <h2>
              {monthName} {currentYear}
            </h2>

            <div className="month-nav">
              <button
                className="nav-btn"
                onClick={handlePreviousMonth}
                aria-label="Previous month"
              >
                &lt;
              </button>

              <button className="nav-btn today-btn" onClick={handleToday}>
                Today
              </button>

              <button
                className="nav-btn"
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                &gt;
              </button>
            </div>
          </div>

          <div className="weekdays-row">
            {weekdays.map((day) => (
              <div key={day} className="weekday-label">
                {day}
              </div>
            ))}
          </div>

          <div className="days-grid">
            {emptyOffset.map((_, index) => (
              <div key={`offset-${index}`} className="day-cell offset" />
            ))}

            {daysArray.map((day) => {
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

              const isSelected = day === selectedDay;

              const dayTasks = ownerTasks.filter(
                (t) => new Date(t.dueDate!).getDate() === day
              );

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`day-cell ${isToday ? "is-today" : ""} ${
                    isSelected ? "is-selected" : ""
                  }`}
                >
                  <span className="day-number">{day}</span>

                  <div className="cell-task-list">
                    {dayTasks.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className={`mini-task-pill ${
                          t.status === "Completed" ? "pill-done" : "pill-pending"
                        }`}
                      >
                        {t.title}
                      </span>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="more-pill">+{dayTasks.length - 2} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* BOTTOM FILTER BAR */}
          <div className="calendar-legend-bar">
            <div className="legend-group">
              <span className="legend-title">
                <Filter size={13} /> Filter View:
              </span>
              {["All", "Pending", "Completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`filter-chip ${
                    activeFilter === status ? "chip-active" : ""
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="legend-status-dots">
              <span className="status-dot-item">
                <span className="dot dot-pending" /> Pending
              </span>
              <span className="status-dot-item">
                <span className="dot dot-done" /> Completed
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR */}
        <aside className="sidebar-container">
          {/* TASKS FOR SELECTED DAY */}
          <div className="side-panel">
            <div className="panel-header">
              <h3>
                Tasks for {monthName} {selectedDay}
              </h3>
              <p className="panel-subtitle">Tasks scheduled on this date</p>
            </div>

            <div className="tasks-list">
              {selectedDayTasks.length > 0 ? (
                selectedDayTasks.map((task) => (
                  <div className="task-item-card" key={task.id}>
                    <div className="task-item-top">
                      <span className="task-name">{task.title}</span>

                      <span
                        className={`badge ${
                          task.status === "Completed"
                            ? "badge-done"
                            : "badge-pending"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <div className="task-item-bottom">
                      <span className="assignee">
                        Priority: {task.priority}
                      </span>
                      <span className="time">{formatDate(task.dueDate!)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="task-item-card empty-card">
                  <span className="task-name empty-text">
                    No tasks scheduled for this day
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC UPCOMING TASKS */}
          <div className="side-panel">
            <div className="panel-header">
              <h3>Upcoming Tasks</h3>
              <p className="panel-subtitle">Next pending deliverables</p>
            </div>

            <div className="upcoming-list">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="upcoming-item-card">
                  <div>
                    <p className="upcoming-day">{task.title}</p>
                    <p className="upcoming-time">
                      Due: {formatDate(task.dueDate!)}
                    </p>
                  </div>
                  <Clock className="upcoming-icon" />
                </div>
              ))}

              {upcomingTasks.length === 0 && (
                <div className="p-3 text-xs text-slate-400">
                  No upcoming pending tasks found.
                </div>
              )}
            </div>
          </div>

          {/* MONTHLY SUMMARY CARD */}
          <div className="side-panel summary-panel">
            <div className="panel-header">
              <h3>Monthly Progress</h3>
              <p className="panel-subtitle">{monthName} task completion</p>
            </div>

            <div className="summary-body">
              <div className="summary-stat">
                <div>
                  <p className="stat-label">Tasks Completed</p>
                  <p className="stat-value">
                    {completedMonthTasks} / {totalMonthTasks}
                  </p>
                </div>
                <div className="stat-badge">{completionPercentage}%</div>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}