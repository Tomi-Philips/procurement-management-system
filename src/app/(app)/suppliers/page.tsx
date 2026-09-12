"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Eye, Edit, Star } from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";
import Pagination from "@/components/ui/pagination";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Supplier, SupplierCategory, Profile } from "@/lib/types";

const PAGE_SIZE = 10;

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formRegNumber, setFormRegNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [page, search, statusFilter]);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(prof);

    let query = supabase.from("suppliers").select("*", { count: "exact" });

    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, count } = await query
      .order("name")
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    setSuppliers(data ?? []);
    setTotal(count ?? 0);

    const { data: cats } = await supabase.from("supplier_categories").select("*").order("name");
    setCategories(cats ?? []);
    setLoading(false);
  };

  const resetForm = () => {
    setFormName("");
    setFormContact("");
    setFormEmail("");
    setFormPhone("");
    setFormAddress("");
    setFormCategoryId("");
    setFormRegNumber("");
    setFormNotes("");
  };

  const handleCreate = async () => {
    if (!formName.trim()) { toast.error("Supplier name is required"); return; }
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("suppliers").insert({
      name: formName,
      contact_person: formContact || null,
      email: formEmail || null,
      phone: formPhone || null,
      address: formAddress || null,
      category_id: formCategoryId || null,
      registration_number: formRegNumber || null,
      notes: formNotes || null,
    });

    if (error) { toast.error("Failed to create supplier"); setSaving(false); return; }
    toast.success("Supplier created");
    setShowCreateModal(false);
    resetForm();
    loadData();
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!selectedSupplier || !formName.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("suppliers")
      .update({
        name: formName,
        contact_person: formContact || null,
        email: formEmail || null,
        phone: formPhone || null,
        address: formAddress || null,
        category_id: formCategoryId || null,
        registration_number: formRegNumber || null,
        notes: formNotes || null,
      })
      .eq("id", selectedSupplier.id);

    if (error) { toast.error("Failed to update supplier"); setSaving(false); return; }
    toast.success("Supplier updated");
    setShowEditModal(false);
    setSelectedSupplier(null);
    resetForm();
    loadData();
    setSaving(false);
  };

  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormName(supplier.name);
    setFormContact(supplier.contact_person ?? "");
    setFormEmail(supplier.email ?? "");
    setFormPhone(supplier.phone ?? "");
    setFormAddress(supplier.address ?? "");
    setFormCategoryId(supplier.category_id ?? "");
    setFormRegNumber(supplier.registration_number ?? "");
    setFormNotes(supplier.notes ?? "");
    setShowEditModal(true);
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

  const SupplierForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Supplier Name *</label>
        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="Company name" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Contact Person</label>
          <input type="text" value={formContact} onChange={(e) => setFormContact(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            placeholder="Contact name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            placeholder="email@company.com" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
          <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            placeholder="Phone number" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
          <select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
        <textarea value={formAddress} onChange={(e) => setFormAddress(e.target.value)} rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
          placeholder="Business address" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Registration Number</label>
        <input type="text" value={formRegNumber} onChange={(e) => setFormRegNumber(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          placeholder="Registration number" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
        <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
          placeholder="Additional notes" />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button onClick={() => { isEdit ? setShowEditModal(false) : setShowCreateModal(false); resetForm(); }}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={isEdit ? handleEdit : handleCreate} disabled={saving}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
          {saving ? "Saving..." : isEdit ? "Update Supplier" : "Create Supplier"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Suppliers</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage supplier information and records</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
            <Plus size={16} /> Add Supplier
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search suppliers..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState title="No suppliers found" description="Add your first supplier to get started."
          actionLabel="Add Supplier" actionHref="#" />
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Performance</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Added</th>
                  {canManage && <th className="px-4 py-3 text-left font-medium text-text-secondary">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{supplier.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{supplier.contact_person ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{supplier.email ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={supplier.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-amber-400" />
                        <span className="text-sm text-foreground">{supplier.performance_score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{formatDate(supplier.created_at)}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <button onClick={() => openEditModal(supplier)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-gray-100 hover:text-foreground">
                          <Edit size={16} />
                        </button>
                      </td>
                    )}
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

      {/* Create Modal */}
      <Modal open={showCreateModal} title="Add Supplier" onClose={() => { setShowCreateModal(false); resetForm(); }}>
        <SupplierForm />
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} title="Edit Supplier" onClose={() => { setShowEditModal(false); setSelectedSupplier(null); resetForm(); }}>
        <SupplierForm isEdit />
      </Modal>
    </div>
  );
}
