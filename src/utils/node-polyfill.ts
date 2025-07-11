/**
 * Node.js environment polyfill for timer functions
 */

// Declare global timer functions if not available
declare function setTimeout(
  callback: (...args: any[]) => void,
  ms: number,
  ...args: any[]
): any;
declare function clearTimeout(timeoutId: any): void;
declare function setInterval(
  callback: (...args: any[]) => void,
  ms: number,
  ...args: any[]
): any;
declare function clearInterval(intervalId: any): void;

/**
 * Einfacher EventEmitter-Polyfill für den Browser
 */
export class EventEmitter {
  private events: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter((l) => l !== listener);
    return this;
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return false;
    this.events[event].forEach((listener) => listener(...args));
    return true;
  }
}

// Export an empty object to make this a module
export {};
