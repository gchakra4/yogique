drop extension if exists "pg_net";

drop policy "Anyone can insert article views" on "public"."article_views";

drop policy "Anyone can read published articles" on "public"."articles";

drop policy "Anyone can read active packages" on "public"."class_packages";

drop policy "Public can read active class schedules" on "public"."class_schedules";

drop policy "Allow anon read access to class_types" on "public"."class_types";

drop policy "Allow anon read access to instructor profiles" on "public"."profiles";

drop policy "Anyone can manage their own ratings" on "public"."ratings";

drop policy "Anyone can read roles" on "public"."roles";

alter table "public"."class_schedules" drop constraint "class_schedules_status_check";

alter table "public"."class_schedules" add constraint "class_schedules_status_check" CHECK (((class_status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'cancelled'::character varying, 'completed'::character varying])::text[]))) not valid;

alter table "public"."class_schedules" validate constraint "class_schedules_status_check";


  create policy "Anyone can insert article views"
  on "public"."article_views"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Anyone can read published articles"
  on "public"."articles"
  as permissive
  for select
  to anon, authenticated
using ((status = 'published'::text));



  create policy "Anyone can read active packages"
  on "public"."class_packages"
  as permissive
  for select
  to anon, authenticated
using ((is_active = true));



  create policy "Public can read active class schedules"
  on "public"."class_schedules"
  as permissive
  for select
  to anon, authenticated
using ((is_active = true));



  create policy "Allow anon read access to class_types"
  on "public"."class_types"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Allow anon read access to instructor profiles"
  on "public"."profiles"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Anyone can manage their own ratings"
  on "public"."ratings"
  as permissive
  for all
  to anon, authenticated
using (true)
with check (true);



  create policy "Anyone can read roles"
  on "public"."roles"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Anyone can insert (for signup)"
  on "auth"."users"
  as permissive
  for insert
  to anon
with check (true);



  create policy "Authenticated users can delete their own row"
  on "auth"."users"
  as permissive
  for delete
  to authenticated
using ((id = ( SELECT auth.uid() AS uid)));



  create policy "Authenticated users can select their own row"
  on "auth"."users"
  as permissive
  for select
  to authenticated
using ((id = ( SELECT auth.uid() AS uid)));



  create policy "Authenticated users can update their own row"
  on "auth"."users"
  as permissive
  for update
  to authenticated
using ((id = ( SELECT auth.uid() AS uid)))
with check ((id = ( SELECT auth.uid() AS uid)));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


  create policy "Allow auth users to upload 1oj01fe_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND (owner = ( SELECT auth.uid() AS uid))));



  create policy "Allow authenticated users to upload their avatar 1oj01fe_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'avatars'::text));



  create policy "Allow authenticated users to upload their avatar 1oj01fe_1"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'avatars'::text));



  create policy "llow all users to view avatars 1oj01fe_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



