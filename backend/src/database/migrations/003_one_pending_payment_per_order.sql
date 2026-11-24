CREATE UNIQUE INDEX idx_one_pending_payment_per_order ON payments(order_id)
    WHERE status = 'pending';