-- Add donut to the closed widget_type presentation set.

alter table public.metric_definitions
  drop constraint if exists metric_definitions_widget_type_check;

alter table public.metric_definitions
  add constraint metric_definitions_widget_type_check
  check (widget_type in (
    'trend_line',
    'bar',
    'progress_to_goal',
    'traffic_light',
    'single_stat',
    'donut'
  ));

alter table public.dashboard_widgets
  drop constraint if exists dashboard_widgets_widget_type_check;

alter table public.dashboard_widgets
  add constraint dashboard_widgets_widget_type_check
  check (widget_type in (
    'trend_line',
    'bar',
    'progress_to_goal',
    'traffic_light',
    'single_stat',
    'donut'
  ));
