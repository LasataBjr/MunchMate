-- Link each reserved physical machine to its specific order item.

ALTER TABLE inventory_reservations
ADD COLUMN order_item_id INTEGER
REFERENCES order_items(id)
ON DELETE RESTRICT
ON UPDATE RESTRICT;

CREATE INDEX idx_reservations_order_item
ON inventory_reservations(order_item_id);