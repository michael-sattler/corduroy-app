import type { FastifyReply, FastifyRequest } from "fastify";
import { type AuthUser, type UserRole } from "./roles.js";
export declare function initSupabaseAuth(url: string, anonKey: string): void;
export declare function verifyAccessToken(token: string): Promise<AuthUser | null>;
export declare function requireRole(role: UserRole): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
declare module "fastify" {
    interface FastifyRequest {
        authUser?: AuthUser;
    }
}
