/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly PORT?: string;
    readonly ENV?: string;
    readonly HOST?: string;
    readonly API_HOST?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
