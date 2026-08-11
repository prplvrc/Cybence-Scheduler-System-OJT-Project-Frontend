import { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Search,
  SlidersHorizontal,
  X,
  Calendar,
  User,
  Tag,
  Clock,
  CheckCircle2,
  UserCheck,
  FileText,
} from "lucide-react";
import NewTaskModal from "./New_Task";
import { getTasks, updateTask, createTask as createTaskApi } from "../api/task.api";
import type { NewTaskFormData } from "./New_Task";
import "./Task_Board.css";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  createdBy: number;
  assignedTo: number | null;
  creator: {
    id: number;
    name: string;
    email: string;
  };
  assignee: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface TaskGroup {
  title: string;
  dotClass: string;
  badgeClass: string;
  tasks: Task[];
}

export interface FilterState {
  search: string;
  priorities: string[];
  statuses: string[];
  sort: "asc" | "desc";
}

type TaskBoardProps = {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  highlightTaskId?: number | null;
  onHighlightHandled?: () => void;
  currentUser?: {
    id: string | number;
    name: string;
    role?: string;
  };
};

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const ALL_STATUSES = ["To Be Assigned", "To Do", "Ongoing", "Completed", "Unfinished"];
const UPDATE_STATUS_OPTIONS = ["To Do", "Ongoing", "Completed"];

function getEffectiveStatus(task: Task): string {
  if (task.status === "Completed") {
    return "Completed";
  }

  if (task.assignedTo == null) {
    return "To Be Assigned";
  }

  if (task.status === "To Be Assigned" || task.status === "Pending") {
    return "To Do";
  }

  if (task.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      return "Unfinished";
    }
  }

  return task.status;
}

const buildTaskGroups = (tasks: Task[]): TaskGroup[] => {
  const groupMap: Record<string, TaskGroup> = {
    "To Be Assigned": {
      title: "To Be Assigned",
      dotClass: "dot-pending",
      badgeClass: "badge-pending",
      tasks: [],
    },
    "To Do": {
      title: "To Do",
      dotClass: "dot-todo",
      badgeClass: "badge-todo",
      tasks: [],
    },
    Ongoing: {
      title: "Ongoing",
      dotClass: "dot-progress",
      badgeClass: "badge-progress",
      tasks: [],
    },
    Completed: {
      title: "Completed",
      dotClass: "dot-completed",
      badgeClass: "badge-done",
      tasks: [],
    },
    Unfinished: {
      title: "Unfinished",
      dotClass: "dot-unfinished",
      badgeClass: "badge-unfinished",
      tasks: [],
    },
  };

  tasks.forEach((task) => {
    if (task.assignedTo == null) {
      groupMap["To Be Assigned"].tasks.push(task);
      return;
    }

    const effectiveStatus = getEffectiveStatus(task);
    if (groupMap[effectiveStatus]) {
      groupMap[effectiveStatus].tasks.push(task);
    }
  });

  return Object.values(groupMap);
};

export default function TaskBoard({
  tasks,
  onTasksChange,
  highlightTaskId,
  onHighlightHandled,
  currentUser,
}: TaskBoardProps) {
  const [filter, setFilter] = useState<FilterState>({
    search: "",
    priorities: [],
    statuses: [],
    sort: "desc",
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Prevent double submissions
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store the latest callback in a ref to avoid stale closure issues without rerunning the fetch effect
  const onTasksChangeRef = useRef(onTasksChange);
  useEffect(() => {
    onTasksChangeRef.current = onTasksChange;
  }, [onTasksChange]);

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      try {
        const response = await getTasks();
        if (isMounted) {
          onTasksChangeRef.current(response.tasks || []);
        }
      } catch (error) {
        console.error("Error loading tasks:", error);
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!highlightTaskId) return;

    const timer = window.setTimeout(() => {
      const targetRow = document.querySelector(`[data-task-id="${highlightTaskId}"]`) as HTMLElement | null;
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
        targetRow.classList.add("is-highlighted");
        window.setTimeout(() => {
          targetRow.classList.remove("is-highlighted");
          onHighlightHandled?.();
        }, 2200);
      } else {
        onHighlightHandled?.();
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [highlightTaskId, onHighlightHandled]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const hasActiveFilters =
    filter.priorities.length > 0 || filter.statuses.length > 0 || filter.sort !== "desc";

  const filteredTasks = useMemo(() => {
    // Deduplicate incoming tasks by ID to prevent repeated UI rows
    const uniqueTasks = Array.from(
      new Map(tasks.map((task) => [task.id, task])).values()
    );

    let result = [...uniqueTasks];

    if (filter.search.trim()) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.creator?.name.toLowerCase().includes(q) ||
          t.assignee?.name.toLowerCase().includes(q)
      );
    }

    if (filter.priorities.length > 0) {
      result = result.filter((t) =>
        filter.priorities.some((p) => p.toLowerCase() === t.priority.toLowerCase())
      );
    }

    if (filter.statuses.length > 0) {
      result = result.filter((t) => filter.statuses.includes(getEffectiveStatus(t)));
    }

    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return filter.sort === "asc" ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [tasks, filter]);

  const taskGroups = buildTaskGroups(filteredTasks);

  const handleCreateTask = async (taskData: NewTaskFormData) => {
    if (isSubmitting) return; // Prevent double trigger
    setIsSubmitting(true);

    try {
      const isOpenForAnyone = taskData.assignTo === "Open for anyone to take";

      await createTaskApi({
        title: taskData.title,
        description: taskData.description,
        status: isOpenForAnyone ? "To Be Assigned" : (taskData.status || "To Do"),
        priority: taskData.priority || "Medium",
        dueDate: taskData.dueDate || null,
        assignedTo: isOpenForAnyone ? null : Number(taskData.assignTo),
      });

      const response = await getTasks();
      onTasksChange(response.tasks || []);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Failed to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus });
      const response = await getTasks();
      onTasksChange(response.tasks || []);
      
      if (selectedTask && selectedTask.id === taskId) {
        const updated = response.tasks.find((t: Task) => t.id === taskId);
        if (updated) setSelectedTask(updated);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status.");
    }
  };

  const handleTakeTask = async (taskId: number) => {
    if (!currentUser?.id) {
      alert("You must be logged in to take a task.");
      return;
    }

    const currentUserId = Number(currentUser.id);

    if (!Number.isFinite(currentUserId)) {
      alert("Your user account is missing a valid numeric ID.");
      return;
    }

    try {
      await updateTask(taskId, {
        assignedTo: currentUserId,
        status: "To Do"
      });

      const response = await getTasks();
      onTasksChange(response.tasks || []);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error taking task:", error);
      alert("Failed to take task.");
    }
  };

  return (
    <div className="task-board-view">
      <header className="page-header">
        <div className="title-group">
          <h1>Tasks</h1>
          <p className="subtitle">Manage, search, and track all team tasks</p>
        </div>

        <div className="header-right">
          <div className="timestamp-badge">
            <span className="date-str">{formattedDate}</span>
            <span className="dot">•</span>
            <span className="time-str">{formattedTime}</span>
          </div>

          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + New Task
          </button>
        </div>
      </header>

      <div className="toolbar-section">
        <div className="filter-controls">
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className={`btn-filter ${hasActiveFilters ? "is-active" : ""}`}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>

            {hasActiveFilters && (
              <span
                role="button"
                tabIndex={0}
                title="Clear filters"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilter({ search: filter.search, priorities: [], statuses: [], sort: "desc" });
                }}
                className="clear-filter-icon"
              >
                <X size={14} />
              </span>
            )}
          </button>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
      </div>

      <div className="sections-container">
        {taskGroups.map((group) => (
          <TaskSection
            key={group.title}
            title={group.title}
            dotClass={group.dotClass}
            tasks={group.tasks}
            highlightTaskId={highlightTaskId ?? null}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        ))}
      </div>

      {showFilterModal && (
        <FilterModal
          filter={filter}
          onChange={(newFilter) => setFilter(newFilter)}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleUpdateTaskStatus}
          onTakeTask={handleTakeTask}
        />
      )}

      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function TaskDetailsModal({
  task,
  onClose,
  onStatusChange,
  onTakeTask,
}: {
  task: Task;
  onClose: () => void;
  onStatusChange: (taskId: number, status: string) => void;
  onTakeTask: (taskId: number) => void;
}) {
  const effectiveStatus = getEffectiveStatus(task);
  const isUnassigned = effectiveStatus === "To Be Assigned";

  return (
    <div className="filter-modal-overlay">
      <div className="filter-modal-card max-w-lg w-full bg-white rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1 pr-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#106fb8]">
              Task Details
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{task.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <FileText className="w-3.5 h-3.5 text-[#106fb8]" /> Description
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {task.description && task.description.trim() !== ""
              ? task.description
              : "No specific details or description provided for this task."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <User className="w-4 h-4 text-[#106fb8]" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Created By</p>
              <p className="font-semibold text-slate-800">{task.creator?.name || "Unknown"}</p>
            </div>
          </div>

          {!isUnassigned && (
            <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
              <UserCheck className="w-4 h-4 text-[#106fb8]" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Assigned To</p>
                <p className="font-semibold text-slate-800">
                  {task.assignedTo ? task.assignee?.name : "Unassigned"}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <Tag className="w-4 h-4 text-[#106fb8]" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Priority</p>
              <span
                className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                  task.priority === "High" || task.priority === "Critical"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {task.priority}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <Calendar className="w-4 h-4 text-[#106fb8]" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Due Date</p>
              <p className="font-semibold text-slate-800">
                {task.dueDate ? formatDate(task.dueDate) : "No due date"}
              </p>
            </div>
          </div>
        </div>

        {!isUnassigned && (
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#106fb8]" /> Update Status
            </label>
            <select
              value={effectiveStatus === "Unfinished" ? "Ongoing" : task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#106fb8] focus:bg-white transition cursor-pointer"
            >
              {UPDATE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {isUnassigned ? (
            <button
              type="button"
              onClick={() => onTakeTask(task.id)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#106fb8] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0d5ca0] transition cursor-pointer"
            >
              <CheckCircle2 size={16} />
              Take This Task
            </button>
          ) : (
            <div className="text-xs text-slate-400 font-medium">
              Assigned to {task.assignedTo ? task.assignee?.name : "Unassigned"}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterModal({
  filter,
  onChange,
  onClose,
}: {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<FilterState>(filter);

  const togglePriority = (p: string) =>
    setLocal((f) => ({
      ...f,
      priorities: f.priorities.includes(p)
        ? f.priorities.filter((x) => x !== p)
        : [...f.priorities, p],
    }));

  const toggleStatus = (s: string) =>
    setLocal((f) => ({
      ...f,
      statuses: f.statuses.includes(s)
        ? f.statuses.filter((x) => x !== s)
        : [...f.statuses, s],
    }));

  return (
    <div className="filter-modal-overlay">
      <div className="filter-modal-card">
        <div className="filter-modal-header">
          <h3>Filter &amp; Sort Tasks</h3>
          <button type="button" onClick={onClose} className="btn-close-modal">
            <X size={18} />
          </button>
        </div>

        <div className="filter-modal-body">
          <div className="filter-group">
            <label className="filter-label">Priority</label>
            <div className="filter-chip-row">
              {PRIORITIES.map((p) => {
                const active = local.priorities.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePriority(p)}
                    className={`filter-chip ${active ? "chip-active" : ""}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Status</label>
            <div className="filter-chip-row">
              {ALL_STATUSES.map((s) => {
                const active = local.statuses.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStatus(s)}
                    className={`filter-chip ${active ? "chip-active" : ""}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sort by Created Date</label>
            <div className="filter-toggle-row">
              {(["desc", "asc"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setLocal((f) => ({ ...f, sort: dir }))}
                  className={`filter-toggle-btn ${local.sort === dir ? "toggle-active" : ""}`}
                >
                  {dir === "desc" ? "Newest first" : "Oldest first"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-modal-actions">
          <button
            type="button"
            className="btn-reset"
            onClick={() =>
              setLocal({ search: filter.search, priorities: [], statuses: [], sort: "desc" })
            }
          >
            Reset
          </button>
          <button
            type="button"
            className="btn-apply"
            onClick={() => {
              onChange(local);
              onClose();
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskSection({
  title,
  dotClass,
  tasks,
  highlightTaskId,
  onSelectTask,
}: {
  title: string;
  dotClass: string;
  tasks: Task[];
  highlightTaskId?: number | null;
  onSelectTask: (task: Task) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="task-group-card">
      <button onClick={() => setOpen(!open)} className="group-header-btn" type="button">
        <div className="header-left">
          {open ? (
            <ChevronDown size={18} className="chevron" />
          ) : (
            <ChevronRight size={18} className="chevron" />
          )}
          <span className={`status-dot ${dotClass}`} />
          <span className="group-title">{title}</span>
        </div>
        <span className="group-count">{tasks.length}</span>
      </button>

      {open && (
        <div className="table-wrapper">
          <table className="task-table">
            <thead>
              <tr>
                <th className="th-cell">TASK</th>
                <th className="th-cell">CREATOR</th>
                <th className="th-cell">ASSIGNED TO</th>
                <th className="th-cell">CREATED ON</th>
                <th className="th-cell">DUE DATE</th>
                <th className="th-cell viewed-by-header">VIEWED BY</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  data-task-id={task.id}
                  onClick={() => onSelectTask(task)}
                  className={`table-row cursor-pointer transition hover:bg-slate-50/80 ${
                    task.id === highlightTaskId ? "highlighted-task-row" : ""
                  }`}
                >
                  <td className="td-cell font-semibold text-slate-800">
                    {task.title}
                  </td>

                  <td className="td-cell text-slate-600">
                    {task.creator?.name || "Unknown"}
                  </td>

                  <td className="td-cell text-slate-600">
                    {task.assignedTo ? task.assignee?.name : "Unassigned"}
                  </td>

                  <td className="td-cell text-slate-500">
                    {formatDate(task.createdAt)}
                  </td>

                  <td className="td-cell text-slate-600">
                    {task.dueDate ? formatDate(task.dueDate) : "-"}
                  </td>

                  <td className="td-cell viewed-by-cell">
                    <div className="views-container">
                      <div className="eye-circle">
                        <Eye size={11} />
                      </div>
                      <div className="eye-circle">
                        <Eye size={11} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}