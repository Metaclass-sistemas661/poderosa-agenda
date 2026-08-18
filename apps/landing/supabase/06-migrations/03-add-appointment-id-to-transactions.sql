-- Add appointment_id reference to transactions table for automatic revenue tracking
-- Migration: 03-add-appointment-id-to-transactions
-- Date: 2026-08-03

-- Add appointment_id column to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_appointment_id ON transactions(appointment_id);

-- Add comment
COMMENT ON COLUMN transactions.appointment_id IS 'Reference to appointment that generated this transaction (for automatic revenue tracking)';
