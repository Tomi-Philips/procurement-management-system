"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Eye, FileText } from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";
import Pagination from "@/components/ui/pagination";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Quotation, QuotationRequest, Supplier, ProcurementRequest, Profile } from "@/lib/types";

const PAGE_SIZE = 10;

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<(Quotation & { suppliers?: Supplier; procurement_requests?: ProcurementRequest })[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ProcurementRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [page, search]);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(prof);

    let query = supabase
      .from("quotations")
      .select("*, suppliers(id, name), procurement_requests(request_number, title)", { count: "exact" });

    if (search) {
      query = query.or(`notes.ilike.%${search}%`);
    }

    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    setQuotations(data ?? []);
    setTotal(count ?? 0);

    // Load approved requests for creating new quotation requests
    const { data: reqs } = await supabase
      .from("procurement_requests")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    setApprovedRequests(reqs ?? []);

    const { data: sups } = await supabase
      .from("suppliers")
      .select("*")
      .eq("status", "active")
      .order("name");

    setSuppliers(sups ?? []);
    setLoading(false);
  };

  const handleCreateQuotationRequest = async () => {
    if (!selectedRequest) { toast.error("Select a procurement request"); return; }
    if (selectedSuppliers.length === 0) { toast.error("Select at least one supplier"); return; }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: qr, error } = await supabase.from("quotation_requests").insert({
      request_id: selectedRequest,
      created_by: user!.id,
      deadline: deadline || null,
      notes: notes || null,
    }).select().single();

    if (error) { toast.error("Failed to create quotation request"); setSaving(false); return; }

    // Add suppliers
    const supplierInserts = selectedSuppliers.map((sid) => ({
      quotation_request_id: qr.id,
      supplier_id: sid,
    }));
    await supabase.from("quotation_request_suppliers").insert(supplierInserts);

    toast.success("Quotation request created");
    setShowCreateModal(false);
    setSelectedRequest("");
    setSelectedSuppliers([]);
    setDeadline("");
    setNotes("");
    loadData();
    setSaving(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const canManage = profile?.role === "admin" || profile?.role === "procurement_officer";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Quotations</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage quotation requests and supplier quotations</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
            <Plus size={16} /> New Quotation Request
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search quotations..."
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
      </div>

      {quotations.length === 0 ? (
        <EmptyState title="No quotations yet" description="Create a quotation request to invite suppliers to submit quotations." />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Request #</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Supplier</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Total Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Submitted</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {(q as any).procurement_requests?.request_number ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {(q as any).suppliers?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3 text-right text-foreground">{formatCurrency(q.total_amount)}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {q.submitted_at ? formatDate(q.submitted_at) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/procurement/quotations/${q.id}`}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-gray-100 hover:text-foreground inline-flex">
                        <Eye size={16} />
                      </a>
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

      {/* Create Quotation Request Modal */}
      <Modal open={showCreateModal} title="New Quotation Request" onClose={() => setShowCreateModal(false)} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Procurement Request *</label>
            <select value={selectedRequest} onChange={(e) => setSelectedRequest(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="">Select approved request</option>
              {approvedRequests.map((req) => (
                <option key={req.id} value={req.id}>{req.request_number} - {req.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Invite Suppliers *</label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-3 space-y-2">
              {suppliers.map((sup) => (
                <label key={sup.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedSuppliers.includes(sup.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedSuppliers([...selectedSuppliers, sup.id]);
                      else setSelectedSuppliers(selectedSuppliers.filter((s) => s !== sup.id));
                    }}
                    className="rounded border-border" />
                  <span className="text-sm text-foreground">{sup.name}</span>
                </label>
              ))}
              {suppliers.length === 0 && <p className="text-sm text-text-secondary">No active suppliers</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
              placeholder="Additional instructions for suppliers" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleCreateQuotationRequest} disabled={saving}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {saving ? "Creating..." : "Create Request"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
