-- 002: stop the operations clock when an order is resolved.
--
-- The order board and order detail screens show a live "Waiting" timer. Before
-- this migration that timer kept ticking after staff marked an order completed,
-- because the only timestamps on `orders` were created_at / updated_at and
-- updated_at also moves for unrelated edits (payment status, notes...).
--
-- resolved_at is stamped the moment an order enters a terminal status and is
-- cleared if the order is ever pushed back into an active status.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

COMMENT ON COLUMN orders.resolved_at IS
  'When the order reached a terminal status (COMPLETED/REJECTED/FAILED/CANCELLED); null while active.';

CREATE INDEX IF NOT EXISTS orders_resolved_at_idx ON orders (resolved_at);

-- Backfill historical orders from their last terminal status change.
UPDATE orders o
SET resolved_at = stamp.last_changed_at
FROM (
  SELECT h.order_id, max(h.created_at) AS last_changed_at
  FROM order_status_history h
  WHERE h.new_status IN ('COMPLETED', 'REJECTED', 'FAILED', 'CANCELLED')
  GROUP BY h.order_id
) stamp
WHERE o.id = stamp.order_id
  AND o.resolved_at IS NULL
  AND o.status IN ('COMPLETED', 'REJECTED', 'FAILED', 'CANCELLED');

-- Anything already in a terminal status but without history falls back to its
-- last update so the board never shows a live clock on a closed order.
UPDATE orders
SET resolved_at = updated_at
WHERE resolved_at IS NULL
  AND status IN ('COMPLETED', 'REJECTED', 'FAILED', 'CANCELLED');
