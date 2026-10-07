"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const users_service_1 = require("../users/users.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(users, jwt, prisma) {
        this.users = users;
        this.jwt = jwt;
        this.prisma = prisma;
    }
    async register(email, password, role) {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.users.createUser(email, passwordHash, role);
        return this.issueTokens(user.id, user.email, user.role);
    }
    async login(email, password) {
        const user = await this.users.findByEmail(email);
        if (!user)
            throw new common_1.UnauthorizedException("Invalid credentials");
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException("Invalid credentials");
        return this.issueTokens(user.id, user.email, user.role);
    }
    async refresh(refreshToken) {
        const [userId] = refreshToken.split(".");
        if (!userId)
            throw new common_1.UnauthorizedException("Invalid refresh token");
        const tokens = await this.prisma.refreshToken.findMany({
            where: { userId, revokedAt: null }
        });
        const match = await this.findMatchingToken(tokens.map((t) => t.tokenHash), refreshToken);
        if (!match)
            throw new common_1.UnauthorizedException("Invalid refresh token");
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() }
        });
        const user = await this.users.findById(userId);
        if (!user)
            throw new common_1.UnauthorizedException("Invalid refresh token");
        return this.issueTokens(user.id, user.email, user.role);
    }
    async issueTokens(userId, email, role) {
        const accessToken = await this.jwt.signAsync({ sub: userId, email, role });
        const refreshPlain = `${userId}.${Math.random().toString(36).slice(2)}`;
        const tokenHash = await bcrypt.hash(refreshPlain, 10);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.prisma.refreshToken.create({
            data: { userId, tokenHash, expiresAt }
        });
        return { accessToken, refreshToken: refreshPlain };
    }
    async findMatchingToken(hashes, token) {
        for (const hash of hashes) {
            const ok = await bcrypt.compare(token, hash);
            if (ok)
                return hash;
        }
        return null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map