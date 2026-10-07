import { PrismaService } from "../prisma/prisma.service";
export declare class WorkspacesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createWorkspace(ownerId: string, name: string): import(".prisma/client").Prisma.Prisma__WorkspaceClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        ownerId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    listByOwner(ownerId: string): import(".prisma/client").Prisma.PrismaPromise<({
        projects: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            key: string;
            workspaceId: string;
            teamId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        ownerId: string;
    })[]>;
}
