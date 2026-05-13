const selector = '[data-reveal]';

const observer = new IntersectionObserver(
    (entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                obs.unobserve(entry.target);

                const element = entry.target as HTMLElement;
                const delay = parseFloat(element.dataset.revealDelay || '0') * 1000;

                setTimeout(() => {
                    element.addEventListener(
                        'transitionend',
                        () => {
                            element.classList.add('is-reveal-complete');
                        },
                        { once: true },
                    );
                    element.classList.add('is-revealed');
                }, delay);
            }
        });
    },
    { threshold: 0, rootMargin: '-10% 0px -10% 0px' },
);

function init(container: Element | Document = document) {
    const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

    elements.forEach((el) => {
        if (el.dataset.reveal === 'instant') {
            setTimeout(
                () => {
                    el.classList.add('is-revealed');

                    el.addEventListener(
                        'transitionend',
                        () => {
                            el.classList.add('is-reveal-complete');
                        },
                        { once: true },
                    );
                    el.classList.add('is-revealed');
                },
                el.dataset.revealDelay ? parseFloat(el.dataset.revealDelay) * 1000 : 0,
            );
        } else {
            observer.observe(el);
        }
    });
}

function veil(container: Element | Document = document) {
    const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

    elements.forEach((el) => {
        observer.unobserve(el);
        el.classList.remove('is-revealed');
        el.classList.remove('is-reveal-complete');
    });
}

function destroy(container: Element | Document = document) {
    const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

    elements.forEach((el) => {
        observer.unobserve(el);
    });
}

function reinit(container: Element | Document = document) {
    destroy(container);

    setTimeout(() => {
        const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

        elements.forEach((el) => {
            el.classList.remove('is-revealed');
            el.classList.remove('is-reveal-complete');
        });
    }, 1);

    setTimeout(() => {
        init(container);
    }, 2);
}

const _module = { init, veil, destroy, reinit };

export default _module;
