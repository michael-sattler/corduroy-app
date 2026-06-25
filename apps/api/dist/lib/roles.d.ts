export type UserRole = "client" | "staff";
export declare function readUserRole(appMetadata: Record<string, unknown> | undefined): UserRole | null;
export type AuthUser = {
    id: string;
    email: string | undefined;
    role: UserRole;
    clientId: string | null;
    staffRole: string | null;
};
export declare function authUserFromSupabase(user: {
    id: string;
    email?: string;
    app_metadata?: Record<string, unknown>;
}): AuthUser | null;
