import { WorkspacesService } from "./workspaces.service";
export declare class WorkspacesController {
    private readonly service;
    constructor(service: WorkspacesService);
    create(body: {
        ownerId: string;
        name: string;
    }): import(".prisma/client").Prisma.Prisma__WorkspaceClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        ownerId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    list(ownerId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
