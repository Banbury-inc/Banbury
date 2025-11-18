// Type declarations for Univerjs modules
declare module '@univerjs/preset-docs-core' {
  export function UniverDocsCorePreset(config: any): any;
  export const FUniver: any;
}

declare module '@univerjs/preset-docs-core/locales/en-US' {
  const locales: any;
  export default locales;
}

declare module '@univerjs/presets' {
  export function createUniver(config: any): { univer: any; univerAPI: any };
  export enum LocaleType {
    EN_US = 'en-US'
  }
  export function mergeLocales(...locales: any[]): any;
}

declare module '@univerjs/preset-docs-core/lib/index.css';
