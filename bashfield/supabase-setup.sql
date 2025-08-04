-- Enable RLS (Row Level Security)
ALTER TABLE IF EXISTS public.listings DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.listings;

-- Create listings table
CREATE TABLE public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  city TEXT NOT NULL,
  rooms INTEGER NOT NULL,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view approved listings" ON public.listings
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can insert their own listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own listings" ON public.listings
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policy (replace with your Gmail)
CREATE POLICY "Admin can do everything" ON public.listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'spadzon@gmail.com'
    )
  );

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('house-images', 'house-images', true);

-- Storage policies
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'house-images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'house-images' AND auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
