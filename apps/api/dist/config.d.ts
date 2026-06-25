export type ApiConfig = {
    port: number;
    supabaseUrl: string;
    supabaseAnonKey: string;
    corsOrigins: string[];
};
export declare function loadConfig(): ApiConfig;
