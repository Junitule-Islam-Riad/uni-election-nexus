
INSERT INTO public.posts (user_id, content, media_url, media_type, poll_options, created_at)
SELECT 'b2788533-d6f5-456d-9c57-7c480c0ef905'::uuid, v.content, NULL, NULL, v.poll::jsonb, now() - v.age
FROM (VALUES
  ('Assalamualaikum everyone! 🌙 CSE Club er Iftar Mahfil hobe next Friday at the campus cafeteria. Sob batch er bhai-bon ra invited. Please RSVP korben! #PCIU #CSEClub'::text, NULL::text, interval '2 hours'),
  ('Midterm shesh!! 🎉 Cha + shingara + adda at TSC stairs, ke ke ashbe? Coffee on me if FSE Robotics wins tomorrow''s demo 😎', NULL, interval '7 hours'),
  ('Reminder: Bangla Debating Society er next session Thursday 4pm. Topic: "Online classes vs Offline classes — which prepared us better?". FHSSL er students specially invited 🎤', NULL, interval '1 day'),
  ('Class Representative vote er age ekta poll kori — kon issue ta apnar kache shobcheye important?', '["Better Wi-Fi in classrooms","More cultural events","Lab equipment upgrade","Mental health support"]', interval '1 day 6 hours'),
  ('Boishakhi Mela 2026 er volunteer form open! Faculty of Business Studies er Marketing dept lead korbe stalls. DM korun jodi join korte chan 🎨🍲 #PohelaBoishakh', NULL, interval '2 days'),
  ('Lost & Found: Ekta blue water bottle TSC math er 4th floor e peyechi. Mone hocche FHSSL er kono apur. Comment korben if it''s yours 💧', NULL, interval '2 days 5 hours'),
  ('FSE Hackathon 36-hour edition coming this December InshaAllah. Theme: "AI for Bangladesh". Prize pool BDT 1,00,000. Team registration shuru next week!', NULL, interval '3 days'),
  ('Library te ekjon vai ekta IELTS book niye boshe ache 3 ghonta dhore — bhai dile please share korbe, exam shamne 😭📚', NULL, interval '4 days')
) AS v(content, poll, age)
WHERE NOT EXISTS (SELECT 1 FROM public.posts p WHERE p.content = v.content);

UPDATE public.profiles
SET community_status = 'approved'
WHERE user_id = 'b2788533-d6f5-456d-9c57-7c480c0ef905'::uuid;
