import { PrismaService } from "../prisma/prisma.service";
export declare class ProjectsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createProject(workspaceId: string, name: string, key: string, teamId?: string): import(".prisma/client").Prisma.Prisma__ProjectClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        teamId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    listByWorkspace(workspaceId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        teamId: string | null;
    }[]>;
}
