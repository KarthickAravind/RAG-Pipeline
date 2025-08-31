/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UI_API_BASE: string
  readonly VITE_ENABLE_HYBRID: string
  readonly VITE_ENABLE_RERANKING: string
  readonly VITE_ENABLE_CHART_CONTROLS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
