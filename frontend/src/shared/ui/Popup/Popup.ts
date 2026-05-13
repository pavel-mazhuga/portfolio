import delegate from 'delegate';
import { NO_SCROLL_CLASS } from '@/shared/config/const';

const closeTimeoutsMap = new Map<HTMLDialogElement, NodeJS.Timeout>();
const openingTimeoutsMap = new Map<HTMLDialogElement, NodeJS.Timeout>();
const closingTimeoutsMap = new Map<HTMLDialogElement, NodeJS.Timeout>();

function init() {
    const transitionBehaviorAllowDiscreteNotSupported =
        navigator.userAgent.includes('Firefox') || !CSS.supports('transition-behavior', 'allow-discrete');

    if (transitionBehaviorAllowDiscreteNotSupported) {
        document.documentElement.classList.add('transition-behavior-allow-discrete-not-supported');
    }

    delegate(document, '[data-dialog-open]', 'click', (event: Event & { delegateTarget: HTMLElement }) => {
        const target = event.delegateTarget;
        const dialog = document.getElementById(target.getAttribute('data-dialog-open')!);

        if (target.getAttribute('data-prevent')) {
            event.preventDefault();
        }

        if (dialog instanceof HTMLDialogElement) {
            if (dialog.getAttribute('data-mode') === 'toast') {
                dialog.show();
            } else {
                dialog.showModal();
            }
        }
    });

    delegate(document, '[data-dialog-close]', 'click', (event: Event & { delegateTarget: HTMLElement }) => {
        const target = event.delegateTarget;
        const dialog = document.getElementById(target.getAttribute('data-dialog-close')!);

        if (target.getAttribute('data-prevent')) {
            event.preventDefault();
        }

        if (dialog instanceof HTMLDialogElement) {
            dialog.close();
        }
    });

    delegate(document, 'dialog', 'click', (event: Event & { delegateTarget: HTMLElement }) => {
        const target = event.target;
        const delegateTarget = event.delegateTarget;

        if (
            delegateTarget instanceof HTMLDialogElement &&
            delegateTarget.getAttribute('closed-by') === 'any' &&
            delegateTarget === target
        ) {
            delegateTarget.close();
        }
    });

    const mo = new MutationObserver((recs) => {
        recs.forEach(({ attributeName: attr, target: dial }) => {
            if (dial instanceof HTMLDialogElement && attr === 'open') {
                if (dial.open) {
                    dial.dispatchEvent(new Event('popup-open'));

                    if (dial.id && !dial.getAttribute('data-ignore-hash')) {
                        history.replaceState(null, '', `#${dial.id}`);
                    }

                    const transitionDuration = parseFloat(
                        getComputedStyle(dial).getPropertyValue('--transition-duration') || '0',
                    );

                    clearTimeout(closeTimeoutsMap.get(dial));
                    clearTimeout(openingTimeoutsMap.get(dial));
                    clearTimeout(closingTimeoutsMap.get(dial));

                    if (dial.getAttribute('data-mode') === 'modal') {
                        document.documentElement.classList.add(NO_SCROLL_CLASS);
                    }
                    dial.classList.add('popup--opening');

                    openingTimeoutsMap.set(
                        dial,
                        setTimeout(
                            () => {
                                dial.classList.remove('popup--opening');
                            },
                            transitionDuration * 1000 + 1,
                        ),
                    );
                } else {
                    dial.dispatchEvent(new Event('popup-close'));

                    if (window.location.hash === `#${dial.id}` && !dial.getAttribute('data-ignore-hash')) {
                        history.replaceState(null, '', window.location.pathname + window.location.search);
                    }

                    const transitionDuration = parseFloat(
                        getComputedStyle(dial).getPropertyValue('--transition-duration') || '0',
                    );

                    clearTimeout(closeTimeoutsMap.get(dial));
                    clearTimeout(openingTimeoutsMap.get(dial));
                    clearTimeout(closingTimeoutsMap.get(dial));

                    closeTimeoutsMap.set(
                        dial,
                        setTimeout(() => {
                            if (dial.getAttribute('data-mode') === 'modal') {
                                document.documentElement.classList.remove(NO_SCROLL_CLASS);
                            }
                        }, transitionDuration * 1000),
                    );

                    dial.classList.add('popup--closing');

                    closingTimeoutsMap.set(
                        dial,
                        setTimeout(
                            () => {
                                dial.classList.remove('popup--closing');
                            },
                            transitionDuration * 1000 + 1,
                        ),
                    );
                }
            }
        });
    });

    document.querySelectorAll('dialog').forEach((dial) => {
        mo.observe(dial, { attributes: true });
    });

    if (window.location.hash) {
        setTimeout(() => {
            const dialog = document.getElementById(window.location.hash.slice(1));

            if (dialog instanceof HTMLDialogElement) {
                if (dialog.getAttribute('data-mode') === 'toast') {
                    dialog.show();
                } else {
                    dialog.showModal();
                }
            }
        }, 0);
    }
}

export default { init };
