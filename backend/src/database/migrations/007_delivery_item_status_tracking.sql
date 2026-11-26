ALTER TABLE delivery_items
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'dispatched', 'delivered'));

ALTER TABLE delivery_items
ADD COLUMN dispatched_at TEXT;

ALTER TABLE delivery_items
ADD COLUMN delivered_at TEXT;