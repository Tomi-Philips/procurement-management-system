"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Truck, Plus } from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";
import Pagination from "@/components/ui/pagination";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Delivery, PurchaseOrder, Profile } from "@/lib/types";

const PAGE_SIZE = 10;

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<(Delivery & { purchase_orders?: any })[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
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
      .from("deliveries")
      .select("*, purchase_orders(po_number, suppliers(name))", { count: "exact" });

    if (search) {
      query = query.ilike("delivery_number", `%${search}%`);
    }

    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    setDeliveries(data ?? []);
    setTotal(count ?? 0);

    const { data: pos } = await supabase
      .from("purchase_orders")
      .select("*")
      .in("status", ["issued", "acknowledged", "partially_delivered"])
      .order("created_at", { ascending: false });

    setPurchaseOrders(pos ?? []);
    setLoading(false);
  };

  const handleCreateDelivery = async () => {
    if (!selectedPO) { toast.error("Select a purchase order"); return; }
    setSaving(true);

    const supabase = createClient();

    // delivery_number is generated atomically by the database (sequence default),
    // so it is intentionally omitted from the insert payload.
    const { error: deliveryInsertError } = await supabase.from("deliveries").insert({
      purchase_order_id: selectedPO,
      expected_date: expectedDate || null,
      notes: deliveryNotes || null,
    });

    if (deliveryInsertError) {
      toast.error(deliveryInsertError.message || "Failed to create delivery");
      setSaving(false);
      return;
    }
    toast.success("Delivery record created");
    setShowCreateModal(false);
    setSelectedPO("");
    setExpectedDate("");
    setDeliveryNotes("");
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
          <h1 className="text-2xl font-semibold text-foreground">Deliveries</h1>
          <p className="mt-1 text-sm text-text-secondary">Track and manage procurement deliveries</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
            <Plus size={16} /> Record Delivery
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search deliveries..."
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
      </div>

      {deliveries.length === 0 ? (
        <EmptyState title="No deliveries recorded" description="Delivery records will appear here once you start tracking deliveries for purchase orders." />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Delivery #</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">PO Number</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Supplier</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Expected</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{del.delivery_number}</td>
                    <td className="px-4 py-3 text-foreground">{(del as any).purchase_orders?.po_number ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground">{(del as any).purchase_orders?.suppliers?.name ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={del.status} /></td>
                    <td className="px-4 py-3 text-text-secondary">{del.expected_date ? formatDate(del.expected_date) : "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{del.actual_date ? formatDate(del.actual_date) : "—"}</td>
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

      {/* Create Delivery Modal */}
      <Modal open={showCreateModal} title="Record Delivery" onClose={() => setShowCreateModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Purchase Order *</label>
            <select value={selectedPO} onChange={(e) => setSelectedPO(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="">Select purchase order</option>
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>{po.po_number}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Expected Delivery Date</label>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
            <textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreateDelivery} disabled={saving}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {saving ? "Creating..." : "Create Delivery"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
