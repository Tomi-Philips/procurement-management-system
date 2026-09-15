"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Send, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { QuotationRequest, Supplier, ProcurementRequest, ProcurementRequestItem, Profile, QuotationItem } from "@/lib/types";

type QuotationRow = {
  id: string;
  quotation_request_id: string;
  supplier_id: string;
  total_amount: number;
  delivery_estimate: string | null;
  validity_period: string | null;
  notes: string | null;
  status: string;
  submitted_at: string | null;
};

type ItemDraft = { description: string; quantity: string; unit_price: string };

type ParentRequestSummary = Pick<
  ProcurementRequest,
  "request_number" | "title" | "purpose" | "description" | "required_date" | "status"
>;

export default function QuotationRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [qr, setQr] = useState<QuotationRequest | null>(null);
  const [parentRequest, setParentRequest] = useState<ParentRequestSummary | null>(null);
  const [items, setItems] = useState<ProcurementRequestItem[]>([]);
  const [mySupplier, setMySupplier] = useState<Supplier | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [existingQuotation, setExistingQuotation] = useState<QuotationRow | null>(null);
  const [existingItems, setExistingItems] = useState<QuotationItem[]>([]);
  const [invitedNames, setInvitedNames] = useState<string[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  // Respond form state
  const [deliveryEstimate, setDeliveryEstimate] = useState("");
  const [validityPeriod, setValidityPeriod] = useState("");
  const [notes, setNotes] = useState("");
  const [draftItems, setDraftItems] = useState<ItemDraft[]>([{ description: "", quantity: "", unit_price: "" }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(prof);
    const isOfficer = prof?.role === "admin" || prof?.role === "procurement_officer";
    setCanManage(Boolean(isOfficer));

    // The quotation request itself (suppliers see it if invited, per RLS)
    const { data: qrData, error: qrError } = await supabase
      .from("quotation_requests")
      .select("*")
      .eq("id", params.id)
      .single();

    if (qrError || !qrData) {
      toast.error("Quotation request not found");
      setLoading(false);
      return;
    }
    setQr(qrData);

    // Parent procurement request: visible to officers, and to suppliers via
    // the additive RLS policy (invited supplier sees minimal fields).
    const { data: parent } = await supabase
      .from("procurement_requests")
      .select("request_number, title, purpose, description, required_date, status")
      .eq("id", qrData.request_id)
      .maybeSingle();
    setParentRequest(parent ?? null);

    // Line items: officers get full detail; suppliers see them via the
    // invited-supplier RLS policy.
    const { data: itemData } = await supabase
      .from("procurement_request_items")
      .select("*")
      .eq("request_id", qrData.request_id);
    setItems(itemData ?? []);

    // Who am I as a supplier? (matched by email, same convention as RLS)
    let supplier: Supplier | null = null;
    if (prof?.role === "supplier") {
      const { data: sup } = await supabase
        .from("suppliers")
        .select("*")
        .eq("email", prof.email)
        .maybeSingle();
      supplier = sup ?? null;
    } else if (isOfficer) {
      // Officers get the invited supplier list for context
      const { data: invited } = await supabase
        .from("quotation_request_suppliers")
        .select("suppliers(id, name, email)")
        .eq("quotation_request_id", qrData.id);

      setInvitedNames(
        (invited ?? []).flatMap((row) => row.suppliers.map((s) => s.name)).filter(Boolean)
      );
    }
    setMySupplier(supplier);

    // My existing quotation, if I already responded (supplier view)
    if (supplier) {
      const { data: q } = await supabase
        .from("quotations")
        .select("*")
        .eq("quotation_request_id", qrData.id)
        .eq("supplier_id", supplier.id)
        .maybeSingle();
      if (q) {
        setExistingQuotation(q);
        setDeliveryEstimate(q.delivery_estimate ?? "");
        setValidityPeriod(q.validity_period ?? "");
        setNotes(q.notes ?? "");
        const { data: qi } = await supabase
          .from("quotation_items")
          .select("*")
          .eq("quotation_id", q.id);
        setExistingItems(qi ?? []);
      }
    }

    setLoading(false);
  };

  const totalDraft = draftItems.reduce(
    (sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0),
    0
  );

  const startEditing = () => {
    if (existingItems.length > 0) {
      setDraftItems(existingItems.map((it) => ({
        description: it.description,
        quantity: String(it.quantity),
        unit_price: String(it.unit_price),
      })));
    }
  };

  const handleSubmit = async () => {
    if (!qr || !mySupplier) return;

    const filled = draftItems.filter((it) => it.description.trim() && parseFloat(it.quantity) > 0 && parseFloat(it.unit_price) > 0);
    if (filled.length === 0) { toast.error("Add at least one item with description, quantity and unit price"); return; }

    setSubmitting(true);
    const supabase = createClient();
    const total = filled.reduce((s, it) => s + parseFloat(it.quantity) * parseFloat(it.unit_price), 0);

    let quotationId: string;

    if (existingQuotation) {
      // Update own quotation (RLS allows suppliers to update their own)
      const { error } = await supabase
        .from("quotations")
        .update({
          total_amount: total,
          delivery_estimate: deliveryEstimate || null,
          validity_period: validityPeriod || null,
          notes: notes || null,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", existingQuotation.id);
      if (error) { toast.error("Failed to update quotation"); setSubmitting(false); return; }
      quotationId = existingQuotation.id;

      // Replace items: delete then re-insert (suppliers manage own items per RLS)
      const { error: delErr } = await supabase
        .from("quotation_items")
        .delete()
        .eq("quotation_id", quotationId);
      if (delErr) { toast.error("Failed to update quotation items"); setSubmitting(false); return; }
    } else {
      // Create quotation (RLS "Suppliers can submit quotations" allows INSERT
      // for the supplier matched by email)
      const { data: q, error } = await supabase
        .from("quotations")
        .insert({
          quotation_request_id: qr.id,
          supplier_id: mySupplier.id,
          total_amount: total,
          delivery_estimate: deliveryEstimate || null,
          validity_period: validityPeriod || null,
          notes: notes || null,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error || !q) { toast.error("Failed to submit quotation"); setSubmitting(false); return; }
      quotationId = q.id;
    }

    const { error: itemsError } = await supabase.from("quotation_items").insert(
      filled.map((it) => ({
        quotation_id: quotationId,
        description: it.description.trim(),
        quantity: parseFloat(it.quantity),
        unit_price: parseFloat(it.unit_price),
      }))
    );

    if (itemsError) {
      toast.error("Quotation saved, but failed to save line items");
      console.error(itemsError);
    } else {
      toast.success(existingQuotation ? "Quotation updated" : "Quotation submitted");
    }

    setSubmitting(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!qr) return null;

  const isSupplier = profile?.role === "supplier";
  const canRespond = isSupplier && mySupplier !== null;
  const deadlinePassed = qr.deadline ? new Date(qr.deadline) < new Date() : false;
  const canSubmit = canRespond && !deadlinePassed && (!existingQuotation || existingQuotation.status !== "evaluated");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/procurement/quotations"
            className="rounded-lg p-2 text-text-secondary hover:bg-gray-100 hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {parentRequest?.request_number ?? "Quotation Request"}
            </h1>
            <p className="text-sm text-text-secondary">{parentRequest?.title ?? "Details"}</p>
          </div>
        </div>
        {qr.deadline && <StatusBadge status={deadlinePassed ? "inactive" : "active"} />}
      </div>

      {/* Request overview */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase">Deadline</p>
            <p className="mt-1 text-sm text-foreground">{qr.deadline ? formatDate(qr.deadline) : "No deadline"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase">Request Status</p>
            <div className="mt-1">{parentRequest ? <StatusBadge status={parentRequest.status} /> : "—"}</div>
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase">My Response</p>
            <div className="mt-1">
              {existingQuotation ? <StatusBadge status={existingQuotation.status} /> : <span className="text-sm text-text-secondary">Not submitted</span>}
            </div>
          </div>
        </div>
        {(parentRequest?.purpose || parentRequest?.description) && (
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase">Description</p>
            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{parentRequest.purpose || parentRequest.description}</p>
          </div>
        )}
        {qr.notes && (
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase">Notes from Procurement</p>
            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{qr.notes}</p>
          </div>
        )}
        {invitedNames.length > 0 && (
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase">Invited Suppliers</p>
            <p className="mt-1 text-sm text-foreground">{invitedNames.join(", ")}</p>
          </div>
        )}
      </div>

      {/* Requested line items */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Requested Items</h2>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-4 text-sm text-text-secondary">No line items available.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="px-5 py-2.5 text-left font-medium text-text-secondary">Description</th>
                <th className="px-5 py-2.5 text-right font-medium text-text-secondary">Qty</th>
                <th className="px-5 py-2.5 text-left font-medium text-text-secondary">Unit</th>
                <th className="px-5 py-2.5 text-left font-medium text-text-secondary">Specifications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="px-5 py-2.5 text-foreground">{it.description}</td>
                  <td className="px-5 py-2.5 text-right text-foreground">{it.quantity}</td>
                  <td className="px-5 py-2.5 text-text-secondary">{it.unit}</td>
                  <td className="px-5 py-2.5 text-text-secondary">{it.specifications ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Respond form (supplier) */}
      {isSupplier && (
        canSubmit ? (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {existingQuotation ? "Update Your Quotation" : "Submit Your Quotation"}
              </h2>
              {existingQuotation && (
                <button onClick={startEditing}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50">
                  Load my items
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Delivery Estimate</label>
                <input type="text" value={deliveryEstimate} onChange={(e) => setDeliveryEstimate(e.target.value)}
                  placeholder="e.g. 14 days"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Validity Period</label>
                <input type="text" value={validityPeriod} onChange={(e) => setValidityPeriod(e.target.value)}
                  placeholder="e.g. 30 days"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Line Items *</label>
              <div className="space-y-2">
                {draftItems.map((it, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="text" value={it.description} placeholder="Description"
                      onChange={(e) => setDraftItems(draftItems.map((d, i) => i === idx ? { ...d, description: e.target.value } : d))}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                    <input type="number" min="0" step="0.01" value={it.quantity} placeholder="Qty"
                      onChange={(e) => setDraftItems(draftItems.map((d, i) => i === idx ? { ...d, quantity: e.target.value } : d))}
                      className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                    <input type="number" min="0" step="0.01" value={it.unit_price} placeholder="Unit price"
                      onChange={(e) => setDraftItems(draftItems.map((d, i) => i === idx ? { ...d, unit_price: e.target.value } : d))}
                      className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                    {draftItems.length > 1 && (
                      <button onClick={() => setDraftItems(draftItems.filter((_, i) => i !== idx))}
                        className="rounded-lg p-2 text-text-secondary hover:bg-red-50 hover:text-red-600" aria-label="Remove item">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setDraftItems([...draftItems, { description: "", quantity: "", unit_price: "" }])}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <Plus size={14} /> Add item
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                placeholder="Anything the procurement team should know" />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-text-secondary">Total: <span className="font-semibold text-foreground">{formatCurrency(totalDraft)}</span></p>
              <button onClick={handleSubmit} disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
                <Send size={16} /> {submitting ? "Submitting..." : existingQuotation ? "Update Quotation" : "Submit Quotation"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">My Quotation</h2>
            {deadlinePassed && !existingQuotation ? (
              <p className="text-sm text-text-secondary">The deadline for this request has passed.</p>
            ) : existingQuotation ? (
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-text-secondary uppercase">Total</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(existingQuotation.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary uppercase">Delivery</p>
                    <p className="text-sm text-foreground">{existingQuotation.delivery_estimate ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary uppercase">Submitted</p>
                    <p className="text-sm text-foreground">{existingQuotation.submitted_at ? formatDateTime(existingQuotation.submitted_at) : "—"}</p>
                  </div>
                </div>
                {existingItems.length > 0 && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-gray-50/50">
                        <th className="py-2 text-left font-medium text-text-secondary">Description</th>
                        <th className="py-2 text-right font-medium text-text-secondary">Qty</th>
                        <th className="py-2 text-right font-medium text-text-secondary">Unit Price</th>
                        <th className="py-2 text-right font-medium text-text-secondary">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {existingItems.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2 text-foreground">{it.description}</td>
                          <td className="py-2 text-right text-foreground">{it.quantity}</td>
                          <td className="py-2 text-right text-foreground">{formatCurrency(it.unit_price)}</td>
                          <td className="py-2 text-right text-foreground">{formatCurrency(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {existingQuotation.status === "submitted" && qr.deadline && new Date(qr.deadline) >= new Date() && (
                  <button onClick={() => { startEditing(); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50">
                    Edit quotation
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                You are invited to respond, but responding is currently unavailable. Contact procurement.
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
