-- Add size_sqm column to listings table
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS size_sqm INTEGER;

-- Add comment to the column
COMMENT ON COLUMN public.listings.size_sqm IS 'Property size in square meters';