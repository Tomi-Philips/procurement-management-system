"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Filter, Eye, Edit } from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";
import Pagination from "@/components/ui/pagination";
import EmptyState from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProcurementRequest, Profile } from "@/lib/types";

const PAGE_SIZE = 10;

export default function RequestsPage() {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [page, search, statusFilter]);

  const loadData = async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    let query = supabase
      .from("procurement_requests")
      .select("*", { count: "exact" });

    // Role-based filtering
    if (profileData?.role === "requester") {
      query = query.eq("requester_id", user.id);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,request_number.ilike.%${search}%`);
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    setRequests(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statuses = [
    "all", "draft", "submitted", "under_review", "approved",
    "rejected", "returned", "processing", "completed",
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Procurement Requests</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage and track procurement requests
          </p>
        </div>
        {(profile?.role === "admin" || profile?.role === "requester") && (
          <Link
            href="/procurement/requests/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={16} />
            New Request
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by title or request number..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {requests.length === 0 ? (
        <EmptyState
          title="No procurement requests"
          description="Create your first procurement request to begin the procurement process."
          actionLabel="New Request"
          actionHref="/procurement/requests/new"
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Request #</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Estimated Total</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{req.request_number}</td>
                    <td className="px-4 py-3 text-foreground">{req.title}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3 text-foreground">{formatCurrency(req.estimated_total)}</td>
                    <td className="px-4 py-3 text-text-secondary">{formatDate(req.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/procurement/requests/${req.id}`}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-gray-100 hover:text-foreground"
                          title="View"
                        >
                          <Eye size={16} />
                        </Link>
                        {req.status === "draft" && req.requester_id === profile?.id && (
                          <Link
                            href={`/procurement/requests/${req.id}/edit`}
                            className="rounded-lg p-1.5 text-text-secondary hover:bg-gray-100 hover:text-foreground"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </Link>
                        )}
                      </div>
                    </td>
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
