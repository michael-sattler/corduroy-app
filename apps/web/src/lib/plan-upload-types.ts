export type PlanIngestRequest = {
  client_id: string;
  s3_key: string;
  plan_id: string;
  plan_title: string;
  size_bytes: number;
};

export type PlanIngestResponse = {
  status: "stub";
  client_id: string;
  plan_id: string;
  s3_key: string;
  message: string;
  counts: {
    participants: number;
    phases: number;
    goals: number;
    milestones: number;
    tasks: number;
    kpis: number;
    risks: number;
  };
};

export type PlanUploadResult = {
  vault: {
    s3_key: string;
    bucket_name: string;
    size_bytes: number;
  };
  ingest: PlanIngestResponse;
};
