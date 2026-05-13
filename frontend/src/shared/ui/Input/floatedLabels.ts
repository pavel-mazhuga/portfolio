export function initFloatedLabel(group: Element) {
    const field = group.querySelector<HTMLInputElement | HTMLTextAreaElement>('.js-form-control');
    const label = group.querySelector<HTMLLabelElement>('.js-form-label');

    if (!field || !label) return;

    const hideLabel = group.getAttribute('data-hide-label') === 'true';
    const isValid = group.getAttribute('data-valid') !== 'false';

    group.classList.toggle('is-error', !isValid);
    field.classList.toggle('is-error', !isValid);

    function update() {
        if (!field || !label) return;

        label.style.removeProperty('height');
        (group as HTMLElement).style.setProperty('--label-height', `${label.offsetHeight}px`);

        const active = document.activeElement === field || field.value.length > 0;

        group.classList.toggle('floated-labels--active', active);
        field.classList.toggle('floated-labels--active', active);
        label.classList.toggle('visually-hidden', hideLabel);
    }

    field.addEventListener('input', update);
    field.addEventListener('focus', update);
    field.addEventListener('blur', update);

    const resizeObserver = new ResizeObserver(() => {
        update();
    });

    resizeObserver.observe(label);

    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                update();
            }
        });
    });

    mutationObserver.observe(field, {
        attributes: true,
        attributeFilter: ['value'],
    });

    update();
}
