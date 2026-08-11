import { useMemo, useState } from "react";
import { FileText, ChevronDown } from "lucide-react";

export type AuditEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  details: string;
};

type AuditLogsProps = {
  logs: AuditEntry[];
};

const filterOptions = [
  { value: "all", label: "All actions" },
  { value: "signed-in", label: "User Login" },
  { value: "signed-out", label: "User Logout" },
  { value: "task", label: "Task Events" },
];

export default function AuditLogs({ logs }: AuditLogsProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredLogs = useMemo(() => {
    if (filter === "all") return logs;
    return logs.filter((log) => {
      if (filter === "signed-in") return log.action.toLowerCase().includes("sign");
      if (filter === "signed-out") return log.action.toLowerCase().includes("sign out") || log.action.toLowerCase().includes("signed out");
      if (filter === "task") return log.action.toLowerCase().includes("task");
      return true;
    });
  }, [filter, logs]);

  return (
    <div className="w-full min-h-[calc(100vh-32px)] p-6 sm:p-8 flex flex-col font-sans text-slate-800">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#106fb8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#106fb8]">
            <FileText className="w-3.5 h-3.5" />
            Audit Logs
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
            <p className="text-sm text-slate-500">
              Review recent system activity and events for the scheduler platform.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            <span className="text-[#106fb8]">{filteredLogs.length}</span> entries
          </div>
          <div className="relative inline-flex items-center rounded-3xl border border-slate-200 bg-white/90 px-4 py-2 shadow-sm">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="appearance-none bg-transparent pr-8 text-sm font-medium text-slate-700 outline-none"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[190px_200px_140px_120px_1fr] gap-4 border-b border-slate-200 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
          <span>TIMESTAMP</span>
          <span>USER</span>
          <span>ACTION</span>
          <span>ENTITY</span>
          <span>DETAILS</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No audit records match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:gap-0">
                <div className="lg:w-47.5">
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(log.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3 lg:w-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#106fb8]/10 text-sm font-bold text-[#106fb8]">
                    {log.user
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{log.user}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:w-35">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#106fb8]">
                    {log.action}
                  </span>
                </div>

                <div className="lg:w-30">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {log.entity}
                  </span>
                </div>

                <div className="text-sm leading-6 text-slate-600 lg:flex-1">
                  {log.details}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
