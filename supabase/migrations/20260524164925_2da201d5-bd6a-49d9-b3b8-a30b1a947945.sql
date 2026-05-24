
-- 1. Remove chat tables from realtime publication (prevents broadcasting PII/messages)
ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_sessions;

-- 2. Harden chat-uploads bucket
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'chat-uploads';

-- Drop the broad SELECT policy (public bucket URLs still work without it; this blocks listing)
DROP POLICY IF EXISTS "Public read chat uploads" ON storage.objects;

-- Admin-only delete and update for content moderation
CREATE POLICY "Admins delete chat uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-uploads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update chat uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-uploads' AND has_role(auth.uid(), 'admin'::app_role));

-- 3. Restrict has_role execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
