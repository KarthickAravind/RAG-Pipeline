declare module 'react' {
  export * from 'react';
  export { default } from 'react';
  
  export function useState<S>(initialState: S | (() => S)): [S, any];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useCallback<T>(callback: T, deps: any[]): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(initialValue?: T): { current: T };
}

declare module 'react-dom' {
  export * from 'react-dom';
  export { default } from 'react-dom';
}

declare module 'react-dom/client' {
  export * from 'react-dom/client';
  export { default } from 'react-dom/client';
}

declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}

declare module '@tanstack/react-query' {
  export class QueryClient {
    constructor(options?: any);
  }
  
  export function QueryClientProvider(props: { client: QueryClient; children: any }): any;
  export function useQuery(options: any): any;
  export function useMutation(options?: any): any;
}
