// This file provides type declarations for service worker related types
// that might be missing from the standard TypeScript libraries

// ExtendableMessageEvent interface
interface ExtendableMessageEvent extends ExtendableEvent {
  readonly data: any;
  readonly lastEventId: string;
  readonly origin: string;
  readonly ports: ReadonlyArray<MessagePort>;
  readonly source: Client | ServiceWorker | MessagePort | null;
}

// Custom type declarations for WebLLM service worker integration
// This provides simplified type definitions to avoid conflicts

declare module '@mlc-ai/web-llm' {
  /**
   * Interface for the MLC Engine
   */
  export interface MLCEngineInterface {
    chat(prompt: string, options?: any): Promise<any>;
    generate(prompt: string, options?: any): Promise<any>;
    runtimeStatsText(): string;
    interruptGenerate(): void;
    unload(): Promise<void>;
  }

  /**
   * Creates a service worker based MLC Engine
   */
  export function CreateServiceWorkerMLCEngine(
    modelName: string,
    options?: any
  ): Promise<MLCEngineInterface>;

  /**
   * Creates a regular MLC Engine
   */
  export function CreateMLCEngine(
    modelName: string,
    options?: any
  ): Promise<MLCEngineInterface>;

  /**
   * Service Worker handler for MLC Engine
   */
  export class ServiceWorkerMLCEngineHandler {
    constructor();
    onmessage(event: any, onComplete?: (value: any) => void, onError?: () => void): void;
  }
}

// Add any other missing types here if needed
