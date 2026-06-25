export function readUserRole(appMetadata) {
    const role = appMetadata?.role;
    if (role === "client" || role === "staff") {
        return role;
    }
    return null;
}
export function authUserFromSupabase(user) {
    const role = readUserRole(user.app_metadata);
    if (!role)
        return null;
    return {
        id: user.id,
        email: user.email,
        role,
        clientId: role === "client"
            ? user.app_metadata?.client_id ?? null
            : null,
        staffRole: role === "staff"
            ? user.app_metadata?.staff_role ?? null
            : null,
    };
}
