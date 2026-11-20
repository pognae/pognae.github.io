/// <reference types="vite/client" />

declare const __ADSENSE_CLIENT__: string;
declare const __SITE_URL__: string;

interface ImportMetaEnv {
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_AD_SLOT_TOP?: string;
  readonly VITE_AD_SLOT_BOTTOM?: string;
  readonly VITE_AD_SLOT_ARTICLE?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_STORAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  adsbygoogle?: Array<Record<string, unknown>>;
}
