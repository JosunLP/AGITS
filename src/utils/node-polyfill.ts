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

// Export an empty object to make this a module
export {};
