import { ProjectsService } from "./projects.service";
export declare class ProjectsController {
    private readonly service;
    constructor(service: ProjectsService);
    create(body: {
        workspaceId: string;
        name: string;
        key: string;
        teamId?: string;
    }): import(".prisma/client").Prisma.Prisma__ProjectClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        teamId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    list(workspaceId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        workspaceId: string;
        teamId: string | null;
    }[]>;
}
