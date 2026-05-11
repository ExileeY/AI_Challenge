INSERT INTO storage.buckets (id, name, public) VALUES ('event-gallery','event-gallery', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read event-gallery"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-gallery');

CREATE POLICY "Authenticated upload to own folder in event-gallery"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner delete own files in event-gallery"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

ALTER TABLE public.feedback ADD CONSTRAINT feedback_unique_per_user UNIQUE (event_id, user_id);