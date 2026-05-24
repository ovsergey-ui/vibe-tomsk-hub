GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone text;

DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT TO public
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 200
    AND char_length(COALESCE(message, '')) <= 5000
    AND char_length(COALESCE(phone, '')) <= 32
    AND (telegram IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL)
  );