
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-uploads', 'chat-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read chat uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-uploads');

CREATE POLICY "Anyone can upload chat images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-uploads');
