/**
 * Global type definitions for Node.js environment
 */

declare global {
  namespace NodeJS {
    interface Process {
      argv: string[];
      exit(code?: number): never;
      on(event: string, listener: (...args: any[]) => void): Process;
      env: { [key: string]: string | undefined };
    }

    interface Global {
      setTimeout(
        callback: (...args: any[]) => void,
        ms: number,
        ...args: any[]
      ): NodeJS.Timeout;
      clearTimeout(timeoutId: NodeJS.Timeout): void;
      setInterval(
        callback: (...args: any[]) => void,
        ms: number,
        ...args: any[]
      ): NodeJS.Timeout;
      clearInterval(intervalId: NodeJS.Timeout): void;
    }

    interface Timeout {}
  }

  const process: NodeJS.Process;

  function setTimeout(
    callback: (...args: any[]) => void,
    ms: number,
    ...args: any[]
  ): NodeJS.Timeout;
  function clearTimeout(timeoutId: NodeJS.Timeout): void;
  function setInterval(
    callback: (...args: any[]) => void,
    ms: number,
    ...args: any[]
  ): NodeJS.Timeout;
  function clearInterval(intervalId: NodeJS.Timeout): void;
}

export {};
