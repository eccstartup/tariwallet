/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DAEMON_URL: string;
  readonly VITE_DEFAULT_NETWORK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
