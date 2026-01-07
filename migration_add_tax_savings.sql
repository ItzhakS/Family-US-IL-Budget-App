-- Migration: Add is_tax_savings column to transactions table
-- Run this SQL in your Supabase SQL editor to add the new column

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_tax_savings boolean DEFAULT false;

-- Update any existing records that might have been marked as investments but should be tax savings
-- (This is optional - adjust based on your data needs)
-- UPDATE transactions SET is_tax_savings = false WHERE is_tax_savings IS NULL;

