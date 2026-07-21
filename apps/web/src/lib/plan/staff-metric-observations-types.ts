export type StaffMetricObservation = {
  id: string;
  value: number;
  period_start: string;
  period_end: string;
  observed_on: string;
  change_source: string;
  source_document: string;
  recorded_at: string;
};

export type StaffMetricObservationsResponse = {
  observations: StaffMetricObservation[];
};

export type StaffMetricObservationsByMetricResponse = {
  observations_by_client_metric_id: Record<string, StaffMetricObservation[]>;
};
