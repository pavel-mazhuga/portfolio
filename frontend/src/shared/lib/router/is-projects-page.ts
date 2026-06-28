export const isProjectsPage = /* @__PURE__ */ (pathname: string) => {
    const trimmed = pathname.replace(/\/+$/, '') || '/';

    return trimmed === '/projects' || trimmed.startsWith('/projects/');
};
