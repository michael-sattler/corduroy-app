-- B1 supplemental: approved staff can browse full client directory in admin console

create policy "clients_select_approved_staff"
  on public.clients
  for select
  to authenticated
  using (public.is_approved_staff());

create policy "client_users_select_approved_staff"
  on public.client_users
  for select
  to authenticated
  using (public.is_approved_staff());

create policy "staff_assignments_select_approved_staff"
  on public.staff_assignments
  for select
  to authenticated
  using (public.is_approved_staff());
