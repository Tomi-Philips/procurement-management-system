export type UserRole = "admin" | "requester" | "approver" | "procurement_officer" | "supplier";

export type RequestStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "returned"
  | "processing"
  | "completed";

export type ApprovalAction = "approved" | "rejected" | "returned";

export type QuotationStatus = "pending" | "submitted" | "evaluated" | "selected" | "rejected";

export type POStatus =
  | "draft"
  | "issued"
  | "acknowledged"
  | "partially_delivered"
  | "delivered"
  | "cancelled"
  | "completed";

export type DeliveryStatus = "pending" | "partial" | "complete";

export type SupplierStatus = "active" | "inactive" | "suspended";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  registration_number: string | null;
  tax_id: string | null;
  category_id: string | null;
  status: SupplierStatus;
  performance_score: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcurementRequest {
  id: string;
  request_number: string;
  title: string;
  department_id: string;
  requester_id: string;
  purpose: string | null;
  description: string | null;
  required_date: string | null;
  priority: string;
  status: RequestStatus;
  estimated_total: number;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcurementRequestItem {
  id: string;
  request_id: string;
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number;
  estimated_total: number;
  specifications: string | null;
  created_at: string;
}

export interface Approval {
  id: string;
  request_id: string;
  approver_id: string;
  action: ApprovalAction;
  comment: string | null;
  previous_status: RequestStatus;
  new_status: RequestStatus;
  created_at: string;
}

export interface QuotationRequest {
  id: string;
  request_id: string;
  created_by: string;
  deadline: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationRequestSupplier {
  id: string;
  quotation_request_id: string;
  supplier_id: string;
  invited_at: string;
}

export interface Quotation {
  id: string;
  quotation_request_id: string;
  supplier_id: string;
  total_amount: number;
  delivery_estimate: string | null;
  validity_period: string | null;
  notes: string | null;
  status: QuotationStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface SupplierEvaluation {
  id: string;
  quotation_id: string;
  evaluator_id: string;
  price_score: number;
  quality_score: number;
  delivery_score: number;
  reliability_score: number;
  compliance_score: number;
  overall_score: number;
  comments: string | null;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  request_id: string;
  supplier_id: string;
  quotation_id: string | null;
  created_by: string;
  order_date: string;
  expected_delivery_date: string | null;
  total_amount: number;
  terms: string | null;
  status: POStatus;
  issued_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Delivery {
  id: string;
  purchase_order_id: string;
  delivery_number: string;
  expected_date: string | null;
  actual_date: string | null;
  status: DeliveryStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  po_item_id: string;
  quantity_delivered: number;
  quantity_outstanding: number;
  notes: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}
