"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Search, Eye, CheckCircle } from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";
import Pagination from "@/components/ui/pagination";
import EmptyState from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProcurementRequest, Profile } from "@/lib/types";

const PAGE_SIZE = 10;

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [page, search]);

  const loadData = async () => {
    const supabase = createClient();

    let query = supabase
      .from("procurement_requests")
      .select("*", { count: "exact" })
      .in("status", ["submitted", "under_review"]);

    if (search) {
      query = query.or(`title.ilike.%${search}%,request_number.ilike.%${search}%`);
    }

    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    setRequests(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Pending Approvals</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review and act on procurement requests awaiting approval
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search requests..."
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="There are no procurement requests awaiting your approval."
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
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Submitted</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Action</th>
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
                      <Link
                        href={`/procurement/requests/${req.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <Eye size={14} />
                        Review
                      </Link>
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
