export const isLabIndexPage = /* @__PURE__ */ (pathname: string) => {
    const normalized = pathname.replace(/\/+$/, '') || '/';

    return normalized === '/lab' || normalized.endsWith('/lab');
};
