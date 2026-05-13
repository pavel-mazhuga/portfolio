import delegate from 'delegate';
import { onOutsideClickAction } from '@/shared/lib/on-outside-click-action';

export const ACTIVE_CLASS = 'dropdown--opened';
export const CONTAINER_SELECTOR = '.js-dropdown';
export const TOGGLER_SELECTOR = '.js-dropdown-toggler';

export function closeDropdown(dropdown: Element) {
    const togglers = Array.from(dropdown.querySelectorAll(TOGGLER_SELECTOR));

    togglers.forEach((toggler) => {
        toggler.setAttribute('aria-expanded', 'false');
    });
    dropdown.classList.remove(ACTIVE_CLASS);
}

export function closeAllDropdowns() {
    const dropdowns = Array.from(document.querySelectorAll(CONTAINER_SELECTOR));

    dropdowns.forEach((dropdown) => closeDropdown(dropdown));
}

export function openDropdown(dropdown: Element) {
    closeAllDropdowns();
    const togglers = Array.from(dropdown.querySelectorAll(TOGGLER_SELECTOR));

    togglers.forEach((toggler) => {
        toggler.setAttribute('aria-expanded', 'true');
    });

    dropdown.classList.add(ACTIVE_CLASS);
}

function init(container: Element | Document = document) {
    delegate(container, '.js-dropdown-toggler', 'click', (event: Event & { delegateTarget: HTMLElement }) => {
        const target = event.delegateTarget;
        const dropdownEl = target.closest<HTMLElement>('.js-dropdown');

        if (dropdownEl) {
            if (dropdownEl.classList.contains(ACTIVE_CLASS)) {
                closeDropdown(dropdownEl);
            } else {
                openDropdown(dropdownEl);
            }
        }
    });

    Array.from(document.querySelectorAll('.js-dropdown')).forEach((dropdownEl) => {
        onOutsideClickAction(dropdownEl, () => {
            if (dropdownEl) {
                closeDropdown(dropdownEl);
            }
        });
    });
}

export default { init };
