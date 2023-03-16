/**
 * Определение, какой класс вешается на `body`,
 * исходя из `pathname`
 */

export const pathnameClassMap = new Map(
    Object.entries({
        '/': 'index-page',
        '/works': 'works-page',
        '/works/[work_id]': 'work-page',
    }),
);
