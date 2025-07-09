/**
 * Event Emitter Utility
 * Provides a typed event emitter base class for services
 */

export interface EventMap {
  [key: string]: (...args: any[]) => void;
}

export class TypedEventEmitter<T extends EventMap> {
  private listeners: { [K in keyof T]?: T[K][] } = {};

  public on<K extends keyof T>(event: K, listener: T[K]): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
    return this;
  }

  public off<K extends keyof T>(event: K, listener: T[K]): this {
    if (!this.listeners[event]) return this;

    const index = this.listeners[event]!.indexOf(listener);
    if (index > -1) {
      this.listeners[event]!.splice(index, 1);
    }
    return this;
  }

  public emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): boolean {
    if (!this.listeners[event]) return false;

    this.listeners[event]!.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for '${String(event)}':`, error);
      }
    });

    return true;
  }

  public once<K extends keyof T>(event: K, listener: T[K]): this {
    const onceWrapper = (...args: Parameters<T[K]>) => {
      this.off(event, onceWrapper as T[K]);
      listener(...args);
    };

    return this.on(event, onceWrapper as T[K]);
  }

  public removeAllListeners<K extends keyof T>(event?: K): this {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
    return this;
  }

  public listenerCount<K extends keyof T>(event: K): number {
    return this.listeners[event]?.length || 0;
  }

  public eventNames(): (keyof T)[] {
    return Object.keys(this.listeners) as (keyof T)[];
  }
}
