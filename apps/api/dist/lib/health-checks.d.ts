export type HealthStatus = "healthy" | "degraded" | "down";
export type HealthCheckResult = {
    service: string;
    status: HealthStatus;
    detail: string;
    latencyMs: number | null;
    checkedAt: string;
};
export declare function checkOrchestrationApi(apiBaseUrl: string): Promise<HealthCheckResult>;
export declare function checkSupabase(supabaseUrl: string, anonKey: string, accessToken: string): Promise<HealthCheckResult>;
export declare function checkNotConfigured(service: string, milestone: string): HealthCheckResult;
