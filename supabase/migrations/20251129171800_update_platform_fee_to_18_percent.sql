-- Update platform fee from 10% to 18%
-- This applies to all new sellers and updates existing sellers

-- Update the default platform fee percentage in the sellers table
ALTER TABLE sellers 
ALTER COLUMN platform_fee_percentage SET DEFAULT 18.00;

-- Update existing sellers to use the new 18% platform fee
UPDATE sellers 
SET platform_fee_percentage = 18.00 
WHERE platform_fee_percentage = 10.00;
