export {};

declare global {
    interface Window {
        rechlyDesktop?: {
            isDesktop: true;
            platform: NodeJS.Platform;
            version: string;
        };
    }
}
