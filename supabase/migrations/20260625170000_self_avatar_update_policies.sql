-- Allow signed-in users to update their own profile row (avatar uploads via server actions).

drop policy if exists "client_users_update_self" on public.client_users;
create policy "client_users_update_self"
  on public.client_users
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "staff_update_self" on public.staff;
create policy "staff_update_self"
  on public.staff
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant update on public.client_users to authenticated;
grant update on public.staff to authenticated;
