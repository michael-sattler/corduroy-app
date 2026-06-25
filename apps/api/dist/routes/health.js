export async function registerHealthRoutes(app) {
    app.get("/health", async () => ({
        status: "ok",
        service: "corduroy-api",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
    }));
}
