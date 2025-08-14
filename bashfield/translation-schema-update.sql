-- Add language detection columns to listings and messages
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS detected_language text DEFAULT 'en';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS detected_language text DEFAULT 'en';

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS idx_listings_language ON public.listings(detected_language);
CREATE INDEX IF NOT EXISTS idx_messages_language ON public.messages(detected_language);

-- Function to detect and store language
CREATE OR REPLACE FUNCTION detect_and_store_language()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple language detection based on character patterns
  IF NEW.title IS NOT NULL OR NEW.description IS NOT NULL THEN
    -- Arabic detection
    IF (NEW.title ~ '[\u0600-\u06FF]' OR NEW.description ~ '[\u0600-\u06FF]') THEN
      NEW.detected_language = 'ar';
    -- Kurdish detection (basic - looks for Kurdish-specific characters)
    ELSIF (NEW.title ~ '[ئەڕێۆوەیەکگ]' OR NEW.description ~ '[ئەڕێۆوەیەکگ]') THEN
      NEW.detected_language = 'ku';
    -- Default to English
    ELSE
      NEW.detected_language = 'en';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to detect message language
CREATE OR REPLACE FUNCTION detect_message_language()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple language detection for messages
  IF NEW.content IS NOT NULL THEN
    -- Arabic detection
    IF NEW.content ~ '[\u0600-\u06FF]' THEN
      NEW.detected_language = 'ar';
    -- Kurdish detection
    ELSIF NEW.content ~ '[ئەڕێۆوەیەکگ]' THEN
      NEW.detected_language = 'ku';
    -- Default to English
    ELSE
      NEW.detected_language = 'en';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic language detection
DROP TRIGGER IF EXISTS listings_detect_language ON public.listings;
CREATE TRIGGER listings_detect_language
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION detect_and_store_language();

DROP TRIGGER IF EXISTS messages_detect_language ON public.messages;
CREATE TRIGGER messages_detect_language
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION detect_message_language();