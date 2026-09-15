-- ============================================
-- PROCUREMENT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM (
  'admin',
  'requester',
  'approver',
  'procurement_officer',
  'supplier'
);

CREATE TYPE request_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'returned',
  'processing',
  'completed'
);

CREATE TYPE approval_action AS ENUM (
  'approved',
  'rejected',
  'returned'
);

CREATE TYPE quotation_status AS ENUM (
  'pending',
  'submitted',
  'evaluated',
  'selected',
  'rejected'
);

CREATE TYPE po_status AS ENUM (
  'draft',
  'issued',
  'acknowledged',
  'partially_delivered',
  'delivered',
  'cancelled',
  'completed'
);

CREATE TYPE delivery_status AS ENUM (
  'pending',
  'partial',
  'complete'
);

CREATE TYPE supplier_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

-- ============================================
-- TABLES
-- ============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'requester',
  department_id UUID,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key for department head
ALTER TABLE profiles ADD CONSTRAINT fk_department
  FOREIGN KEY (department_id) REFERENCES departments(id);

ALTER TABLE departments ADD CONSTRAINT fk_head
  FOREIGN KEY (head_id) REFERENCES profiles(id);

-- Supplier Categories
CREATE TABLE supplier_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  registration_number TEXT,
  tax_id TEXT,
  category_id UUID REFERENCES supplier_categories(id),
  status supplier_status NOT NULL DEFAULT 'active',
  performance_score DECIMAL(3,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Procurement Requests
CREATE SEQUENCE request_number_seq START 1;

CREATE TABLE procurement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT NOT NULL UNIQUE DEFAULT ('PR-' || LPAD(nextval('request_number_seq')::TEXT, 5, '0')),
  title TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  requester_id UUID NOT NULL REFERENCES profiles(id),
  purpose TEXT,
  description TEXT,
  required_date DATE,
  priority TEXT DEFAULT 'normal',
  status request_status NOT NULL DEFAULT 'draft',
  estimated_total DECIMAL(15,2) DEFAULT 0,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Procurement Request Items
CREATE TABLE procurement_request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  estimated_unit_price DECIMAL(15,2) DEFAULT 0,
  estimated_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * estimated_unit_price) STORED,
  specifications TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Approvals
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES procurement_requests(id),
  approver_id UUID NOT NULL REFERENCES profiles(id),
  action approval_action NOT NULL,
  comment TEXT,
  previous_status request_status NOT NULL,
  new_status request_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quotation Requests
CREATE TABLE quotation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES procurement_requests(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  deadline TIMESTAMPTZ,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quotation Request Suppliers
CREATE TABLE quotation_request_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_request_id UUID NOT NULL REFERENCES quotation_requests(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(quotation_request_id, supplier_id)
);

-- Quotations
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_request_id UUID NOT NULL REFERENCES quotation_requests(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  delivery_estimate TEXT,
  validity_period TEXT,
  notes TEXT,
  status quotation_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quotation Items
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supplier Evaluations
CREATE TABLE supplier_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id),
  evaluator_id UUID NOT NULL REFERENCES profiles(id),
  price_score DECIMAL(3,2) DEFAULT 0,
  quality_score DECIMAL(3,2) DEFAULT 0,
  delivery_score DECIMAL(3,2) DEFAULT 0,
  reliability_score DECIMAL(3,2) DEFAULT 0,
  compliance_score DECIMAL(3,2) DEFAULT 0,
  overall_score DECIMAL(3,2) DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Orders
CREATE SEQUENCE po_number_seq START 1;

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number TEXT NOT NULL UNIQUE DEFAULT ('PO-' || LPAD(nextval('po_number_seq')::TEXT, 5, '0')),
  request_id UUID NOT NULL REFERENCES procurement_requests(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  quotation_id UUID REFERENCES quotations(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  terms TEXT,
  status po_status NOT NULL DEFAULT 'draft',
  issued_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deliveries
CREATE SEQUENCE delivery_number_seq START 1;

CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
  delivery_number TEXT NOT NULL DEFAULT ('DEL-' || LPAD(nextval('delivery_number_seq')::TEXT, 5, '0')),
  expected_date DATE,
  actual_date DATE,
  status delivery_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Delivery Items
CREATE TABLE delivery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  po_item_id UUID NOT NULL REFERENCES purchase_order_items(id),
  quantity_delivered DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity_outstanding DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_procurement_requests_status ON procurement_requests(status);
CREATE INDEX idx_procurement_requests_department ON procurement_requests(department_id);
CREATE INDEX idx_procurement_requests_requester ON procurement_requests(requester_id);
CREATE INDEX idx_procurement_requests_number ON procurement_requests(request_number);
CREATE INDEX idx_approvals_request ON approvals(request_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id);
CREATE INDEX idx_quotations_request ON quotations(quotation_request_id);
CREATE INDEX idx_quotations_supplier ON quotations(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_request ON purchase_orders(request_id);
CREATE INDEX idx_deliveries_order ON deliveries(purchase_order_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_category ON suppliers(category_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_request_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid RLS recursion when checking user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Profiles: Users can read all profiles, insert/update own, admin can manage all
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (
  public.get_my_role() = 'admin'
);

-- Departments: Everyone can read, admin can manage
CREATE POLICY "Users can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON departments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Supplier Categories: Everyone can read, admin/procurement can manage
CREATE POLICY "Users can view supplier categories" ON supplier_categories FOR SELECT USING (true);
CREATE POLICY "Procurement can manage categories" ON supplier_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);

-- Suppliers: Users can read, procurement/admin can manage
CREATE POLICY "Users can view suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Procurement can manage suppliers" ON suppliers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);

-- Procurement Requests: Requesters see own, approvers see assigned, procurement sees approved
CREATE POLICY "Users can view relevant requests" ON procurement_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR requester_id = auth.uid()
  OR EXISTS (SELECT 1 FROM approvals WHERE request_id = procurement_requests.id AND approver_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'procurement_officer' AND status IN ('approved', 'processing', 'completed'))
);
CREATE POLICY "Requesters can create requests" ON procurement_requests FOR INSERT WITH CHECK (
  requester_id = auth.uid()
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'requester'))
);
CREATE POLICY "Requesters can update own draft requests" ON procurement_requests FOR UPDATE USING (
  requester_id = auth.uid() AND status = 'draft'
);
CREATE POLICY "Admins can manage all requests" ON procurement_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Procurement Request Items: Follow request permissions
CREATE POLICY "Users can view request items" ON procurement_request_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM procurement_requests WHERE id = request_id AND (
    requester_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer', 'approver'))
  ))
);
CREATE POLICY "Requesters can insert items on own requests" ON procurement_request_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM procurement_requests WHERE id = request_id AND requester_id = auth.uid() AND status IN ('draft', 'submitted'))
);
CREATE POLICY "Requesters can update own draft request items" ON procurement_request_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM procurement_requests WHERE id = request_id AND requester_id = auth.uid() AND status = 'draft')
);
CREATE POLICY "Requesters can delete own draft request items" ON procurement_request_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM procurement_requests WHERE id = request_id AND requester_id = auth.uid() AND status = 'draft')
);
CREATE POLICY "Admins can manage all request items" ON procurement_request_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Approvals: Approvers see assigned, admin sees all
CREATE POLICY "Approvers can view their approvals" ON approvals FOR SELECT USING (
  approver_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Approvers can create approvals" ON approvals FOR INSERT WITH CHECK (
  approver_id = auth.uid()
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'approver'))
);

-- Quotation Requests: Procurement can manage, suppliers see invited
CREATE POLICY "Procurement can manage quotation requests" ON quotation_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);
CREATE POLICY "Suppliers can view invited quotation requests" ON quotation_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM quotation_request_suppliers qrs
    JOIN suppliers s ON s.id = qrs.supplier_id
    WHERE qrs.quotation_request_id = quotation_requests.id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supplier' AND email = s.email)
  )
);

-- Quotation Request Suppliers: Follows quotation request permissions
CREATE POLICY "Users can view quotation request suppliers" ON quotation_request_suppliers FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);
CREATE POLICY "Procurement can manage quotation request suppliers" ON quotation_request_suppliers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);

-- Quotations: Suppliers see own, procurement sees all for their requests
CREATE POLICY "Suppliers can view own quotations" ON quotations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM suppliers s
    WHERE s.id = supplier_id AND s.email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);
CREATE POLICY "Suppliers can submit quotations" ON quotations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM suppliers s
    WHERE s.id = supplier_id AND s.email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
);
CREATE POLICY "Suppliers can update own quotations" ON quotations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM suppliers s
    WHERE s.id = supplier_id AND s.email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Quotation Items: Follows quotation permissions
CREATE POLICY "Users can view quotation items" ON quotation_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM quotations q
    JOIN suppliers s ON s.id = q.supplier_id
    WHERE q.id = quotation_id AND (
      s.email = (SELECT email FROM profiles WHERE id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
    )
  )
);
CREATE POLICY "Suppliers can manage own quotation items" ON quotation_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM quotations q
    JOIN suppliers s ON s.id = q.supplier_id
    WHERE q.id = quotation_id AND s.email = (SELECT email FROM profiles WHERE id = auth.uid())
  )
);

-- Supplier Evaluations: Procurement can manage
CREATE POLICY "Users can view evaluations" ON supplier_evaluations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);
CREATE POLICY "Procurement can manage evaluations" ON supplier_evaluations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);

-- Purchase Orders: Procurement manages, suppliers see own
CREATE POLICY "Users can view relevant purchase orders" ON purchase_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
  OR EXISTS (
    SELECT 1 FROM suppliers s
    WHERE s.id = supplier_id AND s.email = (SELECT email FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "Procurement can manage purchase orders" ON purchase_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);

-- Purchase Order Items: Follows purchase order permissions
CREATE POLICY "Users can view PO items" ON purchase_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);
CREATE POLICY "Procurement can manage PO items" ON purchase_order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);

-- Deliveries: Follows purchase order permissions
CREATE POLICY "Users can view relevant deliveries" ON deliveries FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);
CREATE POLICY "Procurement can manage deliveries" ON deliveries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);

-- Delivery Items: Follows delivery permissions
CREATE POLICY "Users can view delivery items" ON delivery_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);
CREATE POLICY "Procurement can manage delivery items" ON delivery_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'procurement_officer'))
);

-- Notifications: Users see own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
);

-- Audit Logs: Admin can read all, system can write
CREATE POLICY "Admin can view audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can create audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Document numbers (PR-/PO-/DEL-xxxxx) are generated atomically by Postgres
-- sequences wired to the column DEFAULTs on procurement_requests, purchase_orders
-- and deliveries. A sequence never hands out the same value twice, so concurrent
-- inserts (and users with different RLS row visibility) can never collide.

-- Function to update supplier performance score
CREATE OR REPLACE FUNCTION update_supplier_performance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE suppliers
  SET performance_score = (
    SELECT COALESCE(AVG(overall_score), 0)
    FROM supplier_evaluations
    WHERE quotation_id IN (
      SELECT id FROM quotations WHERE supplier_id = NEW.supplier_id
    )
  ),
  updated_at = NOW()
  WHERE id = NEW.supplier_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_performance
  AFTER INSERT OR UPDATE ON supplier_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_performance();

-- Function to update procurement request estimated total
CREATE OR REPLACE FUNCTION update_request_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE procurement_requests
  SET estimated_total = (
    SELECT COALESCE(SUM(estimated_total), 0)
    FROM procurement_request_items
    WHERE request_id = COALESCE(NEW.request_id, OLD.request_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.request_id, OLD.request_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_request_total
  AFTER INSERT OR UPDATE OR DELETE ON procurement_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_request_total();

-- Function to update quotation total
CREATE OR REPLACE FUNCTION update_quotation_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quotations
  SET total_amount = (
    SELECT COALESCE(SUM(total), 0)
    FROM quotation_items
    WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quotation_total
  AFTER INSERT OR UPDATE OR DELETE ON quotation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quotation_total();

-- Function to update PO total
CREATE OR REPLACE FUNCTION update_po_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_po_total
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_po_total();

-- Function to update delivery item outstanding quantity
CREATE OR REPLACE FUNCTION update_delivery_item_outstanding()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quantity_outstanding := COALESCE(
    (SELECT quantity FROM purchase_order_items WHERE id = NEW.po_item_id),
    0
  ) - NEW.quantity_delivered;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_item_outstanding
  BEFORE INSERT OR UPDATE OF po_item_id, quantity_delivered ON delivery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_item_outstanding();

-- Trigger to automatically create a profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'requester'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
