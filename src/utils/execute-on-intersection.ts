export function executeOnIntersection(el: Element, fn: () => void, observerOptions: IntersectionObserverInit = {}) {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                obs.disconnect();
                fn();
            }
        });
    }, observerOptions);

    observer.observe(el);

    return () => observer.disconnect();
}
