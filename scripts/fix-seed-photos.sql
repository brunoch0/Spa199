-- Replace external image hosts (pravatar/unsplash) with self-hosted Supabase Storage URLs.
-- Images are already uploaded to media/seed/. Run this in: Dashboard → SQL Editor.

update public.profiles p
set avatar_url = 'https://mjguemylvigynvoblndu.supabase.co/storage/v1/object/public/media/seed/' || x.file
from (values
  ('11111111-1111-1111-1111-111111111101'::uuid, 't1.jpg'),
  ('11111111-1111-1111-1111-111111111102'::uuid, 't2.jpg'),
  ('11111111-1111-1111-1111-111111111103'::uuid, 't3.jpg'),
  ('11111111-1111-1111-1111-111111111104'::uuid, 't4.jpg'),
  ('11111111-1111-1111-1111-111111111105'::uuid, 't5.jpg'),
  ('11111111-1111-1111-1111-111111111106'::uuid, 't6.jpg'),
  ('22222222-2222-2222-2222-222222222201'::uuid, 'c1.jpg'),
  ('22222222-2222-2222-2222-222222222202'::uuid, 'c2.jpg'),
  ('22222222-2222-2222-2222-222222222203'::uuid, 'c3.jpg')
) as x(id, file)
where p.id = x.id;

update public.therapists set photos = array[
  'https://mjguemylvigynvoblndu.supabase.co/storage/v1/object/public/media/seed/m1.jpg',
  'https://mjguemylvigynvoblndu.supabase.co/storage/v1/object/public/media/seed/m2.jpg',
  'https://mjguemylvigynvoblndu.supabase.co/storage/v1/object/public/media/seed/m3.jpg',
  'https://mjguemylvigynvoblndu.supabase.co/storage/v1/object/public/media/seed/m4.jpg'
] where id = '11111111-1111-1111-1111-111111111101';

update public.therapist_services set photo_url = 'https://mjguemylvigynvoblndu.supabase.co/storage/v1/object/public/media/seed/m1.jpg'
  where therapist_id = '11111111-1111-1111-1111-111111111101' and service_type = 'swedish' and duration_min = 60;
update public.therapist_services set photo_url = 'https://mjguemylvigynvoblndu.supabase.co/storage/v1/object/public/media/seed/m3.jpg'
  where therapist_id = '11111111-1111-1111-1111-111111111101' and service_type = 'deep_tissue';
update public.therapist_services set photo_url = 'https://mjguemylvigynvoblndu.supabase.co/storage/v1/object/public/media/seed/m2.jpg'
  where therapist_id = '11111111-1111-1111-1111-111111111101' and service_type = 'aroma';

-- Expand seed therapist specialties to cover new treatment categories
update public.therapists set specialties = '{swedish,deep_tissue,aroma,hot_stone}' where id = '11111111-1111-1111-1111-111111111101';
update public.therapists set specialties = '{swedish,deep_tissue,reflexology,korean,head_shoulder}' where id = '11111111-1111-1111-1111-111111111102';
update public.therapists set specialties = '{aroma,swedish,thai,balinese,prenatal}' where id = '11111111-1111-1111-1111-111111111103';
update public.therapists set specialties = '{sports,deep_tissue,thai,cupping,lymphatic}' where id = '11111111-1111-1111-1111-111111111104';
update public.therapists set specialties = '{swedish,aroma,reflexology,hot_stone,prenatal}' where id = '11111111-1111-1111-1111-111111111105';
update public.therapists set specialties = '{thai,reflexology,deep_tissue,shiatsu,head_shoulder}' where id = '11111111-1111-1111-1111-111111111106';

-- matching menu items for the new specialties
insert into public.therapist_services (therapist_id, service_type, duration_min, price_aed) values
  ('11111111-1111-1111-1111-111111111101','hot_stone',90,359),
  ('11111111-1111-1111-1111-111111111102','korean',60,249),
  ('11111111-1111-1111-1111-111111111102','head_shoulder',30,129),
  ('11111111-1111-1111-1111-111111111103','balinese',90,329),
  ('11111111-1111-1111-1111-111111111103','prenatal',60,259),
  ('11111111-1111-1111-1111-111111111104','cupping',45,219),
  ('11111111-1111-1111-1111-111111111104','lymphatic',60,289),
  ('11111111-1111-1111-1111-111111111105','hot_stone',90,349),
  ('11111111-1111-1111-1111-111111111105','prenatal',60,249),
  ('11111111-1111-1111-1111-111111111106','shiatsu',60,229),
  ('11111111-1111-1111-1111-111111111106','head_shoulder',30,119);

select full_name, avatar_url from public.profiles order by created_at limit 9;
