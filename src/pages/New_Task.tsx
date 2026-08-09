import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Calendar, Check } from "lucide-react";

export interface NewTaskFormData {
  title: string;
  description: string;
  assignTo: string;
  dueDate: string;
  status: string;
  priority: string;
}

type NewTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: NewTaskFormData) => void;
};

type User = {
  id: number;
  name: string;
};

const priorityOptions = ["Low", "Medium", "High", "Critical"];

export default function NewTaskModal({
  isOpen,
  onClose,
  onSubmit,
}: NewTaskModalProps) {
  const [formData, setFormData] = useState<Omit<NewTaskFormData, "status">>({
    title: "",
    description: "",
    assignTo: "",
    dueDate: "",
    priority: "Medium",
  });

  const [users, setUsers] = useState<User[]>([]);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Load users from backend
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load users");
        }

        const result = await response.json();

        setUsers(result.users);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    };

    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setOpenDropdown(null);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    onSubmit({
      ...formData,
      status: "Pending",
    });

    setFormData({
      title: "",
      description: "",
      assignTo: "",
      dueDate: "",
      priority: "Medium",
    });

    onClose();
  };

  if (!isOpen) return null;

  const renderCustomSelect = (
    label: string,
    name: keyof typeof formData,
    options: string[]
  ) => {
    const isOpenMenu = openDropdown === name;

    return (
      <div className="group relative">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 transition-colors group-focus-within:text-[#106fb8]">
          {label}
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown(name)}
            className={`w-full rounded-xl border bg-slate-50/50 px-3.5 py-2.5 pr-9 text-left text-xs text-slate-800 transition flex items-center justify-between cursor-pointer ${
              isOpenMenu
                ? "border-[#106fb8] bg-white ring-2 ring-[#106fb8]/10"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="truncate">{formData[name]}</span>
            <ChevronDown
              className={`absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-transform duration-200 pointer-events-none ${
                isOpenMenu ? "rotate-180 text-[#106fb8]" : ""
              }`}
            />
          </button>

          {isOpenMenu && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-slate-100 bg-white/95 p-1 shadow-lg backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="max-h-36 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 space-y-0.5">
                {options.map((opt) => {
                  const isSelected = formData[name] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleInputChange(name, opt)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition text-left cursor-pointer ${
                        isSelected
                          ? "bg-[#106fb8]/10 font-semibold text-[#106fb8]"
                          : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate">{opt}</span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#106fb8] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div
        ref={containerRef}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-none rounded-3xl border border-white/80 bg-white/95 p-6 backdrop-blur-2xl shadow-xl"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">New Task</h1>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-3.5">
          {/* Task Title */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 transition-colors group-focus-within:text-[#106fb8]">
              Task Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter task title"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#106fb8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#106fb8]/10"
            />
          </div>

          {/* Description */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 transition-colors group-focus-within:text-[#106fb8]">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe the task in detail"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#106fb8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#106fb8]/10 resize-none"
            />
          </div>

          {/* Row 1: Assign To & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="group">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Assign To
              </label>

              <select
                value={formData.assignTo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assignTo: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs"
              >
                <option value="">Open for Anyone</option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {renderCustomSelect("Priority", "priority", priorityOptions)}
          </div>

          {/* Row 2: Due Date */}
          <div className="group">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 transition-colors group-focus-within:text-[#106fb8]">
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pr-9 text-xs text-slate-800 transition focus:border-[#106fb8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#106fb8]/10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <Calendar className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-[#106fb8] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#106fb8]/20 transition hover:bg-[#0e5ea4] hover:shadow-lg hover:shadow-[#106fb8]/30 cursor-pointer"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}