-- Allow invited suppliers to see the parent procurement request (Step E:
-- suppliers need to know what they are quoting on) and its line items.
-- Linking convention matches existing policies: suppliers.profiles link by email.

CREATE POLICY "Suppliers can view invited request details"
ON procurement_requests FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM quotation_requests qr
    JOIN quotation_request_suppliers qrs ON qrs.quotation_request_id = qr.id
    JOIN suppliers s ON s.id = qrs.supplier_id
    WHERE qr.request_id = procurement_requests.id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role = 'supplier'
          AND email = s.email
      )
  )
);

CREATE POLICY "Invited suppliers can view request items"
ON procurement_request_items FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM quotation_requests qr
    JOIN quotation_request_suppliers qrs ON qrs.quotation_request_id = qr.id
    JOIN suppliers s ON s.id = qrs.supplier_id
    WHERE qr.request_id = procurement_request_items.request_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role = 'supplier'
          AND email = s.email
      )
  )
);
