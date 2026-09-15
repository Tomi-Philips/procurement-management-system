-- ============================================
-- FIX: Requesters could not add items to a newly submitted request
-- ============================================
-- Problem: "Requesters can manage own request items" required the parent
-- request to be status = 'draft'. The new-request flow inserts the request
-- directly as 'submitted', so the follow-up items insert violated RLS
-- (42501) and the user saw "Failed to add items".
--
-- Fix: split the blanket FOR ALL policy:
--   - INSERT: allow attaching items while the request is 'draft' or
--     'submitted' (covers the creation flow),
--   - UPDATE/DELETE: keep the stricter 'draft'-only rule for edits.
-- The admin FOR ALL policy is unchanged.

-- Retry note: if this deadlocks or times out against a busy database, another
-- session is holding locks on procurement_requests / procurement_request_items.
-- The lock_timeout below makes it abort cleanly instead of waiting forever;
-- find the blocking session via pg_stat_activity, terminate it, and re-run.
SET lock_timeout = '10s';

DROP POLICY IF EXISTS "Requesters can manage own request items" ON procurement_request_items;

CREATE POLICY "Requesters can insert items on own requests"
ON procurement_request_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM procurement_requests
    WHERE id = request_id
      AND requester_id = auth.uid()
      AND status IN ('draft', 'submitted')
  )
);

CREATE POLICY "Requesters can update own draft request items"
ON procurement_request_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM procurement_requests
    WHERE id = request_id
      AND requester_id = auth.uid()
      AND status = 'draft'
  )
);

CREATE POLICY "Requesters can delete own draft request items"
ON procurement_request_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM procurement_requests
    WHERE id = request_id
      AND requester_id = auth.uid()
      AND status = 'draft'
  )
);
