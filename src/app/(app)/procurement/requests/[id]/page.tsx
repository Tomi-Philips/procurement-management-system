"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check, X, RotateCcw, Clock, FileText, ShoppingCart, Truck } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type {
  ProcurementRequest,
  ProcurementRequestItem,
  Approval,
  Profile,
  Department,
} from "@/lib/types";

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<ProcurementRequest | null>(null);
  const [items, setItems] = useState<ProcurementRequestItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [requester, setRequester] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadRequest();
  }, []);

  const loadRequest = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(prof);

    const { data: req } = await supabase
      .from("procurement_requests")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!req) { setLoading(false); return; }
    setRequest(req);

    const [itemsRes, approvalsRes, deptRes, reqRes] = await Promise.all([
      supabase.from("procurement_request_items").select("*").eq("request_id", req.id),
      supabase.from("approvals").select("*").eq("request_id", req.id).order("created_at", { ascending: false }),
      supabase.from("departments").select("*").eq("id", req.department_id).single(),
      supabase.from("profiles").select("*").eq("id", req.requester_id).single(),
    ]);

    setItems(itemsRes.data ?? []);
    setApprovals(approvalsRes.data ?? []);
    setDepartment(deptRes.data);
    setRequester(reqRes.data);
    setLoading(false);
  };

  const handleApproval = async (action: "approved" | "rejected" | "returned") => {
    if (!request || !profile) return;
    setActionLoading(true);

    const supabase = createClient();
    const statusMap: Record<string, string> = {
      approved: "approved",
      rejected: "rejected",
      returned: "returned",
    };

    const newStatus = statusMap[action] as any;

    const { error } = await supabase.from("approvals").insert({
      request_id: request.id,
      approver_id: profile.id,
      action,
      comment: comment || null,
      previous_status: request.status,
      new_status: newStatus,
    });

    if (error) {
      toast.error("Failed to record approval");
      setActionLoading(false);
      return;
    }

    await supabase
      .from("procurement_requests")
      .update({
        status: newStatus,
        approved_at: action === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", request.id);

    // Create notification for requester
    await supabase.from("notifications").insert({
      user_id: request.requester_id,
      title: `Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Your procurement request ${request.request_number} has been ${action}.`,
      type: action === "approved" ? "success" : action === "rejected" ? "error" : "warning",
      entity_type: "procurement_request",
      entity_id: request.id,
    });

    toast.success(`Request ${action}`);
    setComment("");
    loadRequest();
    setActionLoading(false);
  };

  // Lifecycle steps
  const lifecycleSteps = [
    { label: "Request", icon: <FileText size={16} />, status: "done" },
    {
      label: "Approval",
      icon: <Check size={16} />,
      status: ["approved", "processing", "completed"].includes(request?.status ?? "")
        ? "done"
        : ["rejected", "returned"].includes(request?.status ?? "")
        ? "error"
        : request?.status === "submitted" || request?.status === "under_review"
        ? "current"
        : "pending",
    },
    {
      label: "Processing",
      icon: <Clock size={16} />,
      status: ["processing", "completed"].includes(request?.status ?? "")
        ? "done"
        : request?.status === "approved"
        ? "current"
        : "pending",
    },
    {
      label: "Purchase Order",
      icon: <ShoppingCart size={16} />,
      status: request?.status === "completed" ? "done" : request?.status === "processing" ? "current" : "pending",
    },
    {
      label: "Delivery",
      icon: <Truck size={16} />,
      status: request?.status === "completed" ? "done" : "pending",
    },
    {
      label: "Completed",
      icon: <Check size={16} />,
      status: request?.status === "completed" ? "done" : "pending",
    },
  ];

  const getStepColor = (status: string) => {
    switch (status) {
      case "done": return "bg-green-500 text-white border-green-500";
      case "current": return "bg-primary text-white border-primary";
      case "error": return "bg-red-500 text-white border-red-500";
      default: return "bg-gray-100 text-text-secondary border-border";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Request not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/procurement/requests" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{request.request_number}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">{request.title}</p>
        </div>
      </div>

      {/* Lifecycle */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Procurement Lifecycle</h3>
        <div className="flex items-center justify-between">
          {lifecycleSteps.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${getStepColor(step.status)}`}>
                  {step.icon}
                </div>
                <span className="mt-2 text-xs font-medium text-text-secondary">{step.label}</span>
              </div>
              {index < lifecycleSteps.length - 1 && (
                <div className={`mx-2 h-0.5 w-8 sm:w-12 ${step.status === "done" ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Info */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Request Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-text-secondary">Department</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{department?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Requester</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{requester?.full_name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Priority</p>
                <p className="mt-0.5 text-sm font-medium text-foreground capitalize">{request.priority}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Required Date</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {request.required_date ? formatDate(request.required_date) : "—"}
                </p>
              </div>
              {request.purpose && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-text-secondary">Purpose</p>
                  <p className="mt-0.5 text-sm text-foreground">{request.purpose}</p>
                </div>
              )}
              {request.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-text-secondary">Description</p>
                  <p className="mt-0.5 text-sm text-foreground">{request.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Requested Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-text-secondary">#</th>
                    <th className="pb-2 text-left font-medium text-text-secondary">Description</th>
                    <th className="pb-2 text-right font-medium text-text-secondary">Qty</th>
                    <th className="pb-2 text-right font-medium text-text-secondary">Unit Price</th>
                    <th className="pb-2 text-right font-medium text-text-secondary">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="py-3 text-text-secondary">{index + 1}</td>
                      <td className="py-3">
                        <p className="text-foreground">{item.description}</p>
                        {item.specifications && (
                          <p className="mt-0.5 text-xs text-text-secondary">{item.specifications}</p>
                        )}
                      </td>
                      <td className="py-3 text-right text-foreground">{item.quantity} {item.unit}</td>
                      <td className="py-3 text-right text-foreground">{formatCurrency(item.estimated_unit_price)}</td>
                      <td className="py-3 text-right font-medium text-foreground">{formatCurrency(item.estimated_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border">
                    <td colSpan={4} className="py-3 text-right font-semibold text-foreground">Total</td>
                    <td className="py-3 text-right font-semibold text-foreground">{formatCurrency(request.estimated_total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Approval Actions (for approvers) */}
          {(profile?.role === "approver" || profile?.role === "admin") &&
            (request.status === "submitted" || request.status === "under_review") && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Approval Action</h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none mb-4"
                placeholder="Add a comment (optional)..."
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleApproval("approved")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  <Check size={16} />
                  Approve
                </button>
                <button
                  onClick={() => handleApproval("rejected")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  <X size={16} />
                  Reject
                </button>
                <button
                  onClick={() => handleApproval("returned")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Return
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          {/* Approval History */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Approval History</h3>
            {approvals.length > 0 ? (
              <div className="space-y-4">
                {approvals.map((approval) => (
                  <div key={approval.id} className="border-l-2 border-border pl-4">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={approval.action} />
                      <span className="text-xs text-text-secondary">
                        {formatDateTime(approval.created_at)}
                      </span>
                    </div>
                    {approval.comment && (
                      <p className="mt-1 text-sm text-text-secondary">{approval.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No approval actions yet</p>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm text-foreground">Created</p>
                  <p className="text-xs text-text-secondary">{formatDateTime(request.created_at)}</p>
                </div>
              </div>
              {request.approved_at && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm text-foreground">Approved</p>
                    <p className="text-xs text-text-secondary">{formatDateTime(request.approved_at)}</p>
                  </div>
                </div>
              )}
              {request.completed_at && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm text-foreground">Completed</p>
                    <p className="text-xs text-text-secondary">{formatDateTime(request.completed_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
