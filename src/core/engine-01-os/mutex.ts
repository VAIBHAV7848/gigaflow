/**
 * ENGINE 01: Escrow & State Scheduler (Operating Systems Principles)
 * Primary Student Owner: Vaishnavi Modekar (02FE24BCS060)
 * Module: Concurrency Mutex & Critical Section Synchronizer
 */

export class AsyncMutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const release = () => {
        if (this.queue.length > 0) {
          const next = this.queue.shift();
          if (next) next();
        } else {
          this.locked = false;
        }
      };

      if (!this.locked) {
        this.locked = true;
        resolve(release);
      } else {
        this.queue.push(() => resolve(release));
      }
    });
  }

  async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await callback();
    } finally {
      release();
    }
  }
}

// Global keyed mutex registry for entity-level synchronization (e.g., milestoneId, contractId)
class KeyedMutexRegistry {
  private locks = new Map<string, AsyncMutex>();

  getMutex(key: string): AsyncMutex {
    let mutex = this.locks.get(key);
    if (!mutex) {
      mutex = new AsyncMutex();
      this.locks.set(key, mutex);
    }
    return mutex;
  }
}

export const keyedLock = new KeyedMutexRegistry();
