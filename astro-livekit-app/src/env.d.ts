/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ASTRO_LIVEKIT_API_KEY: string;
  readonly ASTRO_LIVEKIT_API_SECRET: string;
  readonly ASTRO_LIVEKIT_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
