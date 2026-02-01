/// <reference types="@rsbuild/core/types" />

/**
 * Imports the SVG file as a React component.
 * @requires [@rsbuild/plugin-svgr](https://npmjs.com/package/@rsbuild/plugin-svgr)
 */
declare module '*.svg?react' {
  import type React from 'react';
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

interface ImportMetaEnv {
  readonly BASE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;
