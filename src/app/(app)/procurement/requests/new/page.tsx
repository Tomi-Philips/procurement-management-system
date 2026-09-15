"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Department, Profile } from "@/lib/types";

interface RequestItem {
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number;
  specifications: string;
}

export default function NewRequestPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [priority, setPriority] = useState("normal");
  const [items, setItems] = useState<RequestItem[]>([
    { description: "", quantity: 1, unit: "pcs", estimated_unit_price: 0, specifications: "" },
  ]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);
      if (prof?.department_id) setDepartmentId(prof.department_id);

      const { data: depts } = await supabase.from("departments").select("*").eq("is_active", true).order("name");
      setDepartments(depts ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit: "pcs", estimated_unit_price: 0, specifications: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof RequestItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const estimatedTotal = items.reduce((sum, item) => sum + item.quantity * item.estimated_unit_price, 0);

  const handleSubmit = async (isDraft: boolean) => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!departmentId) { toast.error("Department is required"); return; }
    if (items.some((item) => !item.description.trim())) { toast.error("All items must have a description"); return; }

    setSaving(true);
    const supabase = createClient();

    // Generate request number
    const { count } = await supabase.from("procurement_requests").select("*", { count: "exact", head: true });
    const requestNumber = `PR-${String((count ?? 0) + 1).padStart(5, "0")}`;

    const { data: request, error } = await supabase
      .from("procurement_requests")
      .insert({
        request_number: requestNumber,
        title,
        department_id: departmentId,
        requester_id: profile!.id,
        purpose,
        description,
        required_date: requiredDate || null,
        priority,
        status: isDraft ? "draft" : "submitted",
        estimated_total: estimatedTotal,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create request");
      setSaving(false);
      return;
    }

    // Insert items
    const requestItems = items.map((item) => ({
      request_id: request.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      estimated_unit_price: item.estimated_unit_price,
      specifications: item.specifications || null,
    }));

    const { error: itemsError } = await supabase.from("procurement_request_items").insert(requestItems);

    if (itemsError) {
      toast.error("Failed to add items");
      setSaving(false);
      return;
    }

    toast.success(isDraft ? "Request saved as draft" : "Request submitted successfully");
    router.push("/procurement/requests");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/procurement/requests" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">New Procurement Request</h1>
          <p className="mt-1 text-sm text-text-secondary">Create a new procurement request</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Request Information</h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Enter request title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Department *</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Purpose</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Purpose of the procurement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                placeholder="Additional details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Required Date</label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Requested Items</h3>
              <button
                onClick={addItem}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50"
              >
                <Plus size={14} />
                Add Item
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary">Item {index + 1}</span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Item description *"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Qty"
                      min="0"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(index, "unit", e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Unit"
                    />
                    <input
                      type="number"
                      value={item.estimated_unit_price}
                      onChange={(e) => updateItem(index, "estimated_unit_price", parseFloat(e.target.value) || 0)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Unit price"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <input
                    type="text"
                    value={item.specifications}
                    onChange={(e) => updateItem(index, "specifications", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Specifications (optional)"
                  />
                  <p className="text-xs text-text-secondary text-right">
                    Subtotal: ₦${((item.quantity * item.estimated_unit_price) || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Estimated Total</span>
                <span className="text-lg font-semibold text-foreground">₦{estimatedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-6">
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
