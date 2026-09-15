-- ============================================
-- FIX: Document number generation (PR-xxxxx / PO-xxxxx / DEL-xxxxx)
-- ============================================
-- Problem: generate_request_number() used MAX(...) + 1. Two users could get
-- the same number (race), and with RLS the function only saw the caller's own
-- rows, so it could return a number another user already used -> 23505
-- "duplicate key value violates unique constraint
--  procurement_requests_request_number_key".
--
-- Fix: use Postgres sequences as column DEFAULTs. A sequence never returns the
-- same value twice, regardless of who is inserting or what RLS allows them to
-- see. Existing MAX(number) values are seeded so counting continues cleanly.

-- 1. Create sequences, seeded to the current max number in each table
CREATE SEQUENCE IF NOT EXISTS request_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS delivery_number_seq START 1;

SELECT setval(
  'request_number_seq',
  COALESCE((SELECT MAX(CAST(SUBSTRING(request_number FROM 4) AS INTEGER))
            FROM procurement_requests WHERE request_number ~ '^PR-[0-9]{5,}$'),
           0) + 1,
  false
);

SELECT setval(
  'po_number_seq',
  COALESCE((SELECT MAX(CAST(SUBSTRING(po_number FROM 4) AS INTEGER))
            FROM purchase_orders WHERE po_number ~ '^PO-[0-9]{5,}$'),
           0) + 1,
  false
);

SELECT setval(
  'delivery_number_seq',
  COALESCE((SELECT MAX(CAST(SUBSTRING(delivery_number FROM 5) AS INTEGER))
            FROM deliveries WHERE delivery_number ~ '^DEL-[0-9]{5,}$'),
           0) + 1,
  false
);

-- 2. Make the sequences the column defaults (the column stays NOT NULL;
--    an insert without request_number now gets the next sequence value)
ALTER TABLE procurement_requests
  ALTER COLUMN request_number SET DEFAULT ('PR-' || LPAD(nextval('request_number_seq')::TEXT, 5, '0'));

ALTER TABLE purchase_orders
  ALTER COLUMN po_number SET DEFAULT ('PO-' || LPAD(nextval('po_number_seq')::TEXT, 5, '0'));

ALTER TABLE deliveries
  ALTER COLUMN delivery_number SET DEFAULT ('DEL-' || LPAD(nextval('delivery_number_seq')::TEXT, 5, '0'));

-- 3. Drop the old functions so nothing can call them again.
--    (The client pages previously called generate_request_number() /
--    generate_delivery_number() via RPC; that code is removed too.)
DROP FUNCTION IF EXISTS generate_request_number();
DROP FUNCTION IF EXISTS generate_po_number();
DROP FUNCTION IF EXISTS generate_delivery_number();
