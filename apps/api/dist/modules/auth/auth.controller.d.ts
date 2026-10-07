import { AuthService } from "./auth.service";
type Role = "ADMIN" | "MANAGER" | "ENGINEER" | "QA" | "VIEWER";
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(body: {
        email: string;
        password: string;
        role?: Role;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(body: {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
export {};
