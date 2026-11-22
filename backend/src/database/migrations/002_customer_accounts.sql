-- Add Customer role.
INSERT INTO roles (name, description)
VALUES ('Customer', 'Customer login accounts');

-- Connect login accounts to customer records.
ALTER TABLE users
ADD COLUMN customer_id INTEGER
REFERENCES customers(id)
ON DELETE RESTRICT
ON UPDATE RESTRICT;

-- Allow each customer record to have only one login account.
CREATE UNIQUE INDEX idx_users_customer_id_unique
ON users(customer_id)
WHERE customer_id IS NOT NULL;