import { closeDropdown, dropdownContainerSelector } from '../Dropdown';

const TOGGLER_VALUE_SELECTOR = '.js-select-toggler-value';
const OPTION_SELECTOR = '.js-select-option';
const OPTION_ACTIVE_CLASS = 'select__option--active';

function pickValue(this: HTMLElement) {
    const dropdownElement = this.closest(dropdownContainerSelector);

    if (dropdownElement) {
        const input = dropdownElement.querySelector<HTMLInputElement>('input.js-dropdown-input');
        const options = Array.from(dropdownElement.querySelectorAll(OPTION_SELECTOR));
        const dropdownTogglerValueEl = dropdownElement.querySelector(TOGGLER_VALUE_SELECTOR);

        options.forEach((option) => {
            option.classList.remove(OPTION_ACTIVE_CLASS);
        });

        this.classList.add(OPTION_ACTIVE_CLASS);

        if (dropdownTogglerValueEl && this.dataset.text) {
            if (dropdownTogglerValueEl instanceof HTMLInputElement) {
                dropdownTogglerValueEl.value = this.dataset.text;
            } else {
                dropdownTogglerValueEl.textContent = this.dataset.text;
            }
        }

        if (input && typeof this.dataset.value === 'string') {
            input.value = this.dataset.value;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        closeDropdown(dropdownElement);
    }
}

function init(container: Element | Document = document) {
    const dropdowns = Array.from(container.querySelectorAll<HTMLElement>(dropdownContainerSelector));

    dropdowns.forEach((dropdown) => {
        const options = Array.from(dropdown.querySelectorAll(OPTION_SELECTOR));

        options.forEach((option) => {
            option.addEventListener('click', pickValue);
        });
    });
}

const module = { init };

export default module;
