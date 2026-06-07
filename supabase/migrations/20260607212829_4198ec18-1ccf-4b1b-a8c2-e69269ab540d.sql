
-- Storage policies for videos bucket
CREATE POLICY "Admins can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update videos in storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete videos in storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read videos in storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

-- Same for thumbnails
CREATE POLICY "Admins can upload thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read thumbnails"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'thumbnails' AND public.has_role(auth.uid(), 'admin'));
