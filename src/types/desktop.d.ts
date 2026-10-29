declare module "node:sqlite" {
    export class StatementSync {
        all(...params: unknown[]): unknown[];
        get(...params: unknown[]): unknown;
        run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    }

    export class DatabaseSync {
        constructor(location: string, options?: { open?: boolean });
        exec(sql: string): void;
        prepare(sql: string): StatementSync;
        close(): void;
    }
}

declare module "sqlite" {
    export * from "node:sqlite";
}

interface Window {
    rechlyDesktop?: {
        isDesktop: true;
        platform: NodeJS.Platform;
        version: string;
    };
}
