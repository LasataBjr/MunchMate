ALTER TABLE payments
ADD COLUMN qr_status TEXT NOT NULL DEFAULT 'not_requested'
CHECK (
    qr_status IN (
        'not_requested',
        'requesting',
        'created',
        'unknown',
        'rejected'
    )
);

ALTER TABLE payments
ADD COLUMN qr_attempted_at TEXT;

ALTER TABLE payments
ADD COLUMN qr_created_at TEXT;

ALTER TABLE payments
ADD COLUMN qr_error_code TEXT;

ALTER TABLE payments
ADD COLUMN qr_error_at TEXT;

-- Existing Fonepay attempts need careful classification.
-- A pending payment without a saved QR has an uncertain outcome.
UPDATE payments
SET qr_status = CASE
    WHEN qr_message IS NOT NULL AND TRIM(qr_message) <> '' THEN 'created'
    WHEN status = 'pending' THEN 'unknown'
    ELSE 'not_requested'
END
WHERE provider = 'fonepay';