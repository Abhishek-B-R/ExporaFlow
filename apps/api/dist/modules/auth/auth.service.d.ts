import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
type Role = "ADMIN" | "MANAGER" | "ENGINEER" | "QA" | "VIEWER";
import { PrismaService } from "../prisma/prisma.service";
export declare class AuthService {
    private readonly users;
    private readonly jwt;
    private readonly prisma;
    constructor(users: UsersService, jwt: JwtService, prisma: PrismaService);
    register(email: string, password: string, role: Role): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private issueTokens;
    private findMatchingToken;
}
export {};
