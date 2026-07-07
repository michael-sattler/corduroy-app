-- Public Supabase Storage bucket for organization logos and user avatars (Vercel / serverless).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'platform-images',
  'platform-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "platform_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'platform-images');
