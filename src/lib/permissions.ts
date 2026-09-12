import type { UserRole } from "./types";

const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    "dashboard",
    "requests.view",
    "requests.create",
    "requests.manage",
    "approvals.view",
    "suppliers.view",
    "suppliers.manage",
    "quotations.view",
    "quotations.manage",
    "evaluations.view",
    "evaluations.manage",
    "purchase_orders.view",
    "purchase_orders.manage",
    "deliveries.view",
    "deliveries.manage",
    "reports.view",
    "audit_logs.view",
    "settings.manage",
    "users.manage",
    "departments.manage",
    "notifications.view",
  ],
  requester: [
    "dashboard",
    "requests.view",
    "requests.create",
    "requests.edit",
    "notifications.view",
  ],
  approver: [
    "dashboard",
    "requests.view",
    "approvals.view",
    "approvals.manage",
    "notifications.view",
  ],
  procurement_officer: [
    "dashboard",
    "requests.view",
    "suppliers.view",
    "suppliers.manage",
    "quotations.view",
    "quotations.manage",
    "evaluations.view",
    "evaluations.manage",
    "purchase_orders.view",
    "purchase_orders.manage",
    "deliveries.view",
    "deliveries.manage",
    "reports.view",
    "notifications.view",
  ],
  supplier: [
    "dashboard",
    "quotations.view",
    "quotations.submit",
    "purchase_orders.view",
    "notifications.view",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Administrator",
    requester: "Department Staff",
    approver: "Approving Officer",
    procurement_officer: "Procurement Officer",
    supplier: "Supplier",
  };
  return labels[role] ?? role;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-blue-100 text-blue-700",
    under_review: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    returned: "bg-orange-100 text-orange-700",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-700",
    suspended: "bg-red-100 text-red-700",
    issued: "bg-blue-100 text-blue-700",
    acknowledged: "bg-blue-100 text-blue-700",
    partially_delivered: "bg-amber-100 text-amber-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    partial: "bg-amber-100 text-amber-700",
    complete: "bg-green-100 text-green-700",
    evaluated: "bg-blue-100 text-blue-700",
    selected: "bg-green-100 text-green-700",
  };
  return colors[status] ?? "bg-gray-100 text-gray-700";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    returned: "Returned",
    processing: "Processing",
    completed: "Completed",
    pending: "Pending",
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
    issued: "Issued",
    acknowledged: "Acknowledged",
    partially_delivered: "Partially Delivered",
    delivered: "Delivered",
    cancelled: "Cancelled",
    partial: "Partial",
    complete: "Complete",
    evaluated: "Evaluated",
    selected: "Selected",
  };
  return labels[status] ?? status;
}
