export function getOffsetTop(el: Element, windowScrollY = window.scrollY, heightOffset = 0): number {
    return el.getBoundingClientRect().top + windowScrollY - heightOffset;
}

export function wrap(toWrap: Element, wrapper?: HTMLElement) {
    const _wrapper = wrapper || document.createElement('div');
    toWrap.parentNode?.appendChild(_wrapper);
    _wrapper.appendChild(toWrap);
    return _wrapper;
}

export function isElementInViewport(el: Element) {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
}

const NO_SCROLL_CLASS = 'no-scroll';

export function lockBodyScroll() {
    document.body.classList.add(NO_SCROLL_CLASS);
}

export function unlockBodyScroll() {
    document.body.classList.remove(NO_SCROLL_CLASS);
}
