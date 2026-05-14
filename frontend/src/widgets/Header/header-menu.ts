import { navigate } from 'astro:transitions/client';
import { onOutsideClickAction } from '@/shared/lib/on-outside-click-action';

const MOBILE_MQ = '(max-width: 767px), (max-width: 900px) and (orientation: landscape)';
const MOBILE_MENU_CLOSE_FALLBACK_MS = 1600;

function isInternalNavigationLink(link: HTMLAnchorElement): boolean {
    if (link.target === '_blank' || link.hasAttribute('download')) {
        return false;
    }

    try {
        const url = new URL(link.href, window.location.href);

        return url.origin === window.location.origin;
    } catch {
        return false;
    }
}

export function setupHeaderMenu(): () => void {
    const headerEl = document.querySelector<HTMLElement>('.js-header');
    const menuEl = document.querySelector<HTMLElement>('.js-header-menu');
    const toggleEl = document.querySelector<HTMLElement>('.js-header-menu-toggle');
    const closeBtn = document.querySelector<HTMLElement>('.js-header-menu-close');

    if (!headerEl || !menuEl || !toggleEl) {
        return () => {};
    }

    const header = headerEl;
    const menu = menuEl;
    const toggle = toggleEl;

    let removeOutside: (() => void) | undefined;
    let cancelPendingNavigate: (() => void) | undefined;

    const isMobile = () => window.matchMedia(MOBILE_MQ).matches;

    const prefersReducedMotion = () =>
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function close() {
        cancelPendingNavigate?.();
        cancelPendingNavigate = undefined;
        header.classList.remove('is-menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        removeOutside?.();
        removeOutside = undefined;
    }

    function closeThenNavigate(href: string) {
        close();

        if (prefersReducedMotion()) {
            void navigate(href);

            return;
        }

        let finished = false;
        const finish = () => {
            if (finished) {
                return;
            }

            finished = true;
            menu.removeEventListener('transitionend', onTransitionEnd);
            window.clearTimeout(fallbackId);
            cancelPendingNavigate = undefined;
            void navigate(href);
        };

        const onTransitionEnd = (event: TransitionEvent) => {
            if (event.target === menu && event.propertyName === 'visibility') {
                finish();
            }
        };

        menu.addEventListener('transitionend', onTransitionEnd);
        const fallbackId = window.setTimeout(finish, MOBILE_MENU_CLOSE_FALLBACK_MS);

        cancelPendingNavigate = () => {
            if (finished) {
                return;
            }

            finished = true;
            menu.removeEventListener('transitionend', onTransitionEnd);
            window.clearTimeout(fallbackId);
            cancelPendingNavigate = undefined;
        };
    }

    function open() {
        if (!isMobile()) {
            return;
        }

        header.classList.add('is-menu-open');
        toggle.setAttribute('aria-expanded', 'true');
        removeOutside?.();
        removeOutside = onOutsideClickAction([menu, toggle], close);
    }

    function toggleMenu() {
        if (header.classList.contains('is-menu-open')) {
            close();
        } else {
            open();
        }
    }

    const onToggleClick = (event: MouseEvent) => {
        event.preventDefault();
        toggleMenu();
    };

    const onCloseClick = () => {
        close();
    };

    const onNavLinkClick = (event: MouseEvent) => {
        const link = event.currentTarget as HTMLAnchorElement;

        if (!isMobile() || !header.classList.contains('is-menu-open')) {
            return;
        }

        if (!isInternalNavigationLink(link)) {
            close();

            return;
        }

        event.preventDefault();
        closeThenNavigate(link.href);
    };

    const onMqChange = () => {
        if (!isMobile()) {
            close();
        }
    };

    toggle.addEventListener('click', onToggleClick);
    closeBtn?.addEventListener('click', onCloseClick);

    const navLinks = menu.querySelectorAll<HTMLAnchorElement>('.js-header-nav-link');

    navLinks.forEach((link) => {
        link.addEventListener('click', onNavLinkClick);
    });

    const mq = window.matchMedia(MOBILE_MQ);

    mq.addEventListener('change', onMqChange);

    return () => {
        toggle.removeEventListener('click', onToggleClick);
        closeBtn?.removeEventListener('click', onCloseClick);
        navLinks.forEach((link) => {
            link.removeEventListener('click', onNavLinkClick);
        });
        mq.removeEventListener('change', onMqChange);
        close();
    };
}
