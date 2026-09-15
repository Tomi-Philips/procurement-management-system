-- ============================================
-- FIX: Approvers could not see or act on submitted requests
-- ============================================
-- Problem 1: the SELECT policy only let approvers see requests that already
-- had an approvals row naming them - but nothing creates approvals rows until
-- someone acts. Result: /procurement/approvals always showed "No pending
-- approvals" for role = 'approver'.
-- Problem 2: no UPDATE policy allowed role = 'approver' to move a request
-- through the approval transition, so the Approve/Reject action failed
-- silently on the request detail page.
--
-- Fix: let approvers see requests that are pending their action, and let
-- them update a request while it is pending (any resulting status).

SET lock_timeout = '10s';

-- 1. Visibility (replaces the previous version; adds the approver clause)
DROP POLICY IF EXISTS "Users can view relevant requests" ON procurement_requests;

CREATE POLICY "Users can view relevant requests" ON procurement_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR requester_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'approver'
      AND procurement_requests.status IN ('submitted', 'under_review')
  )
  OR EXISTS (
    SELECT 1 FROM approvals
    WHERE request_id = procurement_requests.id AND approver_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'procurement_officer'
      AND procurement_requests.status IN ('approved', 'processing', 'completed')
  )
);

-- 2. Action: approvers may update a request while it awaits approval
--    (USING gates which rows they can touch; WITH CHECK allows any
--    resulting status, since approving changes the status itself)
DROP POLICY IF EXISTS "Approvers can act on pending requests" ON procurement_requests;

CREATE POLICY "Approvers can act on pending requests" ON procurement_requests FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'approver')
  AND procurement_requests.status IN ('submitted', 'under_review')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'approver')
);
