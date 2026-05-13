interface SchedulerOptions {
    delay?: number;
    priority?: 'user-blocking' | 'user-visible' | 'background';
    signal?: AbortSignal;
}

interface TaskScheduler {
    schedule<T = void>(task: () => T, options?: SchedulerOptions): Promise<T>;
    yield(): Promise<void>;
}

interface WindowScheduler {
    postTask<T>(task: () => T, options?: SchedulerOptions): Promise<T>;
    yield(): Promise<void>;
}

function createScheduler(): TaskScheduler {
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
            async yield(): Promise<void> {
                return (window.scheduler as WindowScheduler).yield();
            },
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

                // Отмена через AbortSignal
                signal?.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error('Task was aborted'));
                });
            });
        },
        async yield(): Promise<void> {
            return new Promise<void>((resolve) => setTimeout(resolve, 0));
        },
    };
}

export const taskScheduler = createScheduler();
