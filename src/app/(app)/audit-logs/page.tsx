"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, ClipboardList } from "lucide-react";
import Pagination from "@/components/ui/pagination";
import EmptyState from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog, Profile } from "@/lib/types";

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<(AuditLog & { profiles?: Profile })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [page, search, entityFilter]);

  const loadData = async () => {
    const supabase = createClient();

    let query = supabase
      .from("audit_logs")
      .select("*, profiles(full_name, email)", { count: "exact" });

    if (search) {
      query = query.ilike("action", `%${search}%`);
    }
    if (entityFilter !== "all") {
      query = query.eq("entity_type", entityFilter);
    }

    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    setLogs(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const entityTypes = [
    "all", "procurement_request", "approval", "supplier",
    "quotation", "purchase_order", "delivery", "user",
  ];

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("submit")) return "text-green-600";
    if (action.includes("approve")) return "text-green-600";
    if (action.includes("reject")) return "text-red-600";
    if (action.includes("return")) return "text-amber-600";
    if (action.includes("delete") || action.includes("cancel")) return "text-red-600";
    return "text-text-secondary";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audit Logs</h1>
        <p className="mt-1 text-sm text-text-secondary">Track all important system actions</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by action..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary">
          {entityTypes.map((t) => (
            <option key={t} value={t}>{t === "all" ? "All Entities" : t.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No audit logs" description="Audit records will appear here as actions are performed in the system." />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">User</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Entity</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{(log as any).profiles?.full_name ?? "System"}</p>
                      <p className="text-xs text-text-secondary">{(log as any).profiles?.email ?? ""}</p>
                    </td>
                    <td className={`px-4 py-3 font-medium ${getActionColor(log.action)}`}>{log.action}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{log.entity_type.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">{log.entity_id?.slice(0, 8) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
