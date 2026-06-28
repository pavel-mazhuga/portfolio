interface SchedulerIdleOptions {
    timeout?: number;
    signal?: AbortSignal;
}

interface SchedulerOptions {
    delay?: number;
    priority?: 'user-blocking' | 'user-visible' | 'background';
    signal?: AbortSignal;
}

interface TaskScheduler {
    schedule<T = void>(task: () => T, options?: SchedulerOptions): Promise<T>;
    scheduleIdle(task: () => void, options?: SchedulerIdleOptions): void;
    yield(): Promise<void>;
    yieldFrame(): Promise<void>;
}

interface WindowScheduler {
    postTask<T>(task: () => T, options?: SchedulerOptions): Promise<T>;
    yield(): Promise<void>;
}

function createScheduler(): TaskScheduler {
    const scheduleIdle = (task: () => void, { timeout = 2000, signal }: SchedulerIdleOptions = {}): void => {
        if (signal?.aborted) {
            return;
        }

        const run = () => {
            if (signal?.aborted) {
                return;
            }

            task();
        };

        if (typeof requestIdleCallback === 'function') {
            const idleId = requestIdleCallback(run, { timeout });

            signal?.addEventListener('abort', () => cancelIdleCallback(idleId), { once: true });

            return;
        }

        const timeoutId = setTimeout(run, 0);

        signal?.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });
    };

    const yieldFrame = (): Promise<void> =>
        new Promise((resolve) => {
            requestAnimationFrame(() => resolve());
        });

    if (typeof window !== 'undefined' && 'scheduler' in window) {
        return {
            async schedule<T = void>(task: () => T, options: SchedulerOptions = {}): Promise<T> {
                const { signal, ...schedulerOptions } = options;

                if (signal?.aborted) {
                    return Promise.reject(new Error('Task was aborted'));
                }

                return (window.scheduler as WindowScheduler).postTask(task, {
                    ...schedulerOptions,
                    signal,
                });
            },
            scheduleIdle,
            async yield(): Promise<void> {
                return (window.scheduler as WindowScheduler).yield();
            },
            yieldFrame,
        };
    }

    return {
        async schedule<T = void>(task: () => T, { delay = 0, signal }: SchedulerOptions = {}): Promise<T> {
            return new Promise<T>((resolve, reject) => {
                if (signal?.aborted) {
                    reject(new Error('Task was aborted'));

                    return;
                }

                const timeoutId = setTimeout(() => {
                    try {
                        if (signal?.aborted) {
                            reject(new Error('Task was aborted'));

                            return;
                        }

                        resolve(task());
                    } catch (error) {
                        reject(error);
                    }
                }, delay);

                signal?.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error('Task was aborted'));
                });
            });
        },
        scheduleIdle,
        async yield(): Promise<void> {
            return new Promise<void>((resolve) => setTimeout(resolve, 0));
        },
        yieldFrame,
    };
}

export const taskScheduler = createScheduler();
