-- =========================================
-- A. STAFF AND ACCESS
-- =========================================
-- Roles(Admin, Sales, Warehouse, Delivery) stores the types of staff accounts
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- users stores the actual staff accounts
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
        CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

-- =========================================
-- B. CUSTOMERS
-- =========================================
-- email is not unique. Two customers might share a company email address
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_type TEXT NOT NULL
        CHECK (customer_type IN ('individual', 'company')),
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- A customer can have multiple addresses, 
-- so we don't put all address fields directly inside customers
CREATE TABLE customer_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    address_type TEXT NOT NULL
        CHECK (address_type IN ('billing', 'delivery', 'office', 'other')),
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT,
    province TEXT,
    country TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

-- =========================================
-- C. MACHINE CATALOGUE
-- =========================================

-- categories such as snack machines or beverage machines
CREATE TABLE machine_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- the catalogue products munchmate sells
CREATE TABLE machine_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    model_number TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    specifications TEXT,
    base_price_paisa INTEGER NOT NULL
        CHECK (base_price_paisa >= 0),

    currency TEXT NOT NULL DEFAULT 'NPR' CHECK (currency = 'NPR'),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)
        REFERENCES machine_categories(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

-- photographs belonging to each catalogue model
CREATE TABLE machine_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_model_id INTEGER NOT NULL,
    image_path TEXT NOT NULL,
    is_primary INTEGER NOT NULL DEFAULT 0
        CHECK (is_primary IN (0, 1)),
    display_order INTEGER NOT NULL DEFAULT 0
        CHECK (display_order >= 0),

    FOREIGN KEY (machine_model_id)
        REFERENCES machine_models(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX idx_machine_one_primary_image
ON machine_images(machine_model_id)
WHERE is_primary = 1;


-- =========================================
-- D. ENQUIRIES AND QUOTATIONS
-- =========================================
-- Relationship: enquiries → quotations → quotation_items

CREATE TABLE enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    enquiry_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN (
            'new',
            'reviewing',
            'quoted',
            'converted',
            'cancelled'
        )),
    message TEXT,
    assigned_to INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (assigned_to)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE TABLE enquiry_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enquiry_id INTEGER NOT NULL,
    machine_model_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,

    FOREIGN KEY (enquiry_id)
        REFERENCES enquiries(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (machine_model_id)
        REFERENCES machine_models(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE TABLE quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enquiry_id INTEGER NOT NULL,
    quotation_number TEXT NOT NULL UNIQUE,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN (
            'draft',
            'sent',
            'accepted',
            'rejected',
            'expired',
            'superseded'
        )),

    subtotal_paisa INTEGER NOT NULL CHECK (subtotal_paisa >= 0),
    discount_paisa INTEGER NOT NULL DEFAULT 0 CHECK (discount_paisa >= 0),
    tax_amount_paisa INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount_paisa >= 0),
    total_amount_paisa INTEGER NOT NULL
        CHECK (
            total_amount_paisa = subtotal_paisa - discount_paisa + tax_amount_paisa
            AND total_amount_paisa >= 0
        ),
    valid_until TEXT,
    terms TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (enquiry_id, version_number),

    FOREIGN KEY (enquiry_id)
        REFERENCES enquiries(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE TABLE quotation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER NOT NULL,
    machine_model_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_paisa INTEGER NOT NULL CHECK (unit_price_paisa >= 0),
    line_total_paisa INTEGER NOT NULL CHECK (line_total_paisa = quantity * unit_price_paisa),

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (machine_model_id)
        REFERENCES machine_models(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

-- =========================================
-- E. ORDERS AND PAYMENTS
-- =========================================

-- order is created from an accepted quotation
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    quotation_id INTEGER NOT NULL UNIQUE,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'confirmed'
        CHECK (status IN (
            'confirmed',
            'processing',
            'completed',
            'cancelled'
        )),
    payment_status TEXT NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN (
            'unpaid',
            'pending',
            'paid',
            'partially_refunded',
            'refunded'
        )),
    fulfillment_status TEXT NOT NULL DEFAULT 'awaiting_stock'
        CHECK (fulfillment_status IN (
            'awaiting_stock',
            'stock_reserved',
            'partially_dispatched',
            'partially_delivered',
            'delivered'
        )),
    subtotal_paisa INTEGER NOT NULL CHECK (subtotal_paisa >= 0),
    discount_paisa INTEGER NOT NULL DEFAULT 0 CHECK (discount_paisa >= 0),
    tax_amount_paisa INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount_paisa >= 0),
    total_amount_paisa INTEGER NOT NULL
        CHECK (
            total_amount_paisa = subtotal_paisa - discount_paisa + tax_amount_paisa
            AND total_amount_paisa >= 0
        ),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    quotation_item_id INTEGER NOT NULL,
    machine_model_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_paisa INTEGER NOT NULL CHECK (unit_price_paisa >= 0),
    line_total_paisa INTEGER NOT NULL
        CHECK (line_total_paisa = quantity * unit_price_paisa),

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (quotation_item_id)
        REFERENCES quotation_items(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (machine_model_id)
        REFERENCES machine_models(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    UNIQUE (order_id, quotation_item_id)
);

-- payments table records every attempt
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    payment_method TEXT,
    amount_paisa INTEGER NOT NULL CHECK (amount_paisa > 0),
    currency TEXT NOT NULL DEFAULT 'NPR' CHECK (currency = 'NPR'),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'successful',
            'failed',
            'expired'
        )),
    provider_reference TEXT NOT NULL UNIQUE,
    provider_transaction_id TEXT,
    idempotency_key TEXT,
    initiated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TEXT,
    failure_reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX idx_payment_transaction_unique
ON payments(provider, provider_transaction_id)
WHERE provider_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX idx_payment_idempotency_unique
ON payments(idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX idx_one_successful_payment_per_order
ON payments(order_id)
WHERE status = 'successful';

-- =========================================
-- F. WAREHOUSE AND INVENTORY
-- =========================================

CREATE TABLE warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE machine_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_model_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    serial_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'available'
        CHECK (status IN (
            'available',
            'reserved',
            'dispatched',
            'maintenance',
            'returned'
        )),
    purchase_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (machine_model_id)
        REFERENCES machine_models(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE TABLE inventory_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    machine_inventory_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN (
            'active',
            'released',
            'fulfilled'
        )),
    reserved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (machine_inventory_id)
        REFERENCES machine_inventory(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

-- It prevents two orders from reserving the same physical machine at the same time
CREATE UNIQUE INDEX idx_one_active_reservation_per_machine
ON inventory_reservations(machine_inventory_id)
WHERE status = 'active';

-- inventory_movements provides a history of what happened to each machine
CREATE TABLE inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_inventory_id INTEGER NOT NULL,
    movement_type TEXT NOT NULL
        CHECK (movement_type IN (
            'received',
            'reserved',
            'released',
            'dispatched',
            'returned',
            'adjustment'
        )),
    reference_type TEXT,
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (machine_inventory_id)
        REFERENCES machine_inventory(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

-- =========================================
-- G. DELIVERY AND INSTALLATION
-- =========================================

CREATE TABLE deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    delivery_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'scheduled',
            'dispatched',
            'partially_delivered',
            'delivered',
            'cancelled'
        )),

    -- Address snapshot: preserve the destination used for this shipment
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT,
    province TEXT,
    country TEXT NOT NULL,
    tracking_reference TEXT,
    scheduled_at TEXT,
    delivered_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE TABLE delivery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL,
    reservation_id INTEGER NOT NULL UNIQUE,

    FOREIGN KEY (delivery_id)
        REFERENCES deliveries(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (reservation_id)
        REFERENCES inventory_reservations(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE TABLE installations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    delivery_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'scheduled',
            'in_progress',
            'completed',
            'cancelled'
        )),

    -- Installation location can be filled in when scheduling
    address_line TEXT,
    city TEXT,
    district TEXT,
    province TEXT,
    country TEXT,
    scheduled_at TEXT,
    completed_at TEXT,
    assigned_to INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (delivery_id)
        REFERENCES deliveries(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (assigned_to)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE TABLE installation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    installation_id INTEGER NOT NULL,
    reservation_id INTEGER NOT NULL UNIQUE,

    FOREIGN KEY (installation_id)
        REFERENCES installations(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (reservation_id)
        REFERENCES inventory_reservations(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);


-- =========================================
-- H. FOREIGN KEY INDEXES
-- =========================================

CREATE INDEX idx_users_role ON users(role_id);

CREATE INDEX idx_customer_addresses_customer
ON customer_addresses(customer_id);

CREATE INDEX idx_machine_models_category
ON machine_models(category_id);

CREATE INDEX idx_machine_images_model
ON machine_images(machine_model_id);

CREATE INDEX idx_enquiries_customer
ON enquiries(customer_id);

CREATE INDEX idx_enquiries_assigned_to
ON enquiries(assigned_to);

CREATE INDEX idx_enquiry_items_enquiry
ON enquiry_items(enquiry_id);

CREATE INDEX idx_enquiry_items_model
ON enquiry_items(machine_model_id);

CREATE INDEX idx_quotations_enquiry
ON quotations(enquiry_id);

CREATE INDEX idx_quotations_created_by
ON quotations(created_by);

CREATE INDEX idx_quotation_items_quotation
ON quotation_items(quotation_id);

CREATE INDEX idx_quotation_items_model
ON quotation_items(machine_model_id);

CREATE INDEX idx_orders_customer
ON orders(customer_id);

CREATE INDEX idx_order_items_order
ON order_items(order_id);

CREATE INDEX idx_order_items_quotation_item
ON order_items(quotation_item_id);

CREATE INDEX idx_order_items_model
ON order_items(machine_model_id);

CREATE INDEX idx_payments_order
ON payments(order_id);

CREATE INDEX idx_machine_inventory_model
ON machine_inventory(machine_model_id);

CREATE INDEX idx_machine_inventory_warehouse
ON machine_inventory(warehouse_id);

CREATE INDEX idx_reservations_order
ON inventory_reservations(order_id);

CREATE INDEX idx_reservations_machine
ON inventory_reservations(machine_inventory_id);

CREATE INDEX idx_movements_machine
ON inventory_movements(machine_inventory_id);

CREATE INDEX idx_movements_created_by
ON inventory_movements(created_by);

CREATE INDEX idx_deliveries_order
ON deliveries(order_id);

CREATE INDEX idx_delivery_items_delivery
ON delivery_items(delivery_id);

CREATE INDEX idx_installations_order
ON installations(order_id);

CREATE INDEX idx_installations_delivery
ON installations(delivery_id);

CREATE INDEX idx_installations_assigned_to
ON installations(assigned_to);

CREATE INDEX idx_installation_items_installation
ON installation_items(installation_id);