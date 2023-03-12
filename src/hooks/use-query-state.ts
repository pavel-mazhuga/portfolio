import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/router';
import { usePrevious } from './use-previous';

type IParam = string;
type IValue = string | string[] | number | number[] | null | undefined;
type IState = { [k: string]: IValue };
type IQuery = IState;
type IRoute = string;

export function isEmpty(value: IValue | IValue[]): boolean {
    return (
        value === null ||
        value === undefined ||
        (typeof value === 'number' && isNaN(value)) ||
        (typeof value !== 'number' && value.length === 0) ||
        (Array.isArray(value) && value.length === 0)
    );
}

function isRouteParam(route: IRoute, param: IParam): boolean {
    return new RegExp(`\\[${param}\\]`, 'g').test(route);
}

function filterRouteParams(query: IQuery, route: IRoute): IQuery {
    return Object.entries(query).reduce(
        (obj, [k, v]) => (isRouteParam(route, k) ? obj : Object.assign(obj, { [k]: v })),
        {},
    );
}

/**
 * Filters out query entries if their are not present in the state
 *
 * Ex.:
 * query = { foo: 1, bar: "", baz: 2 }
 * state = { foo: 3, bar: 4 }
 * returns = { foo: 1 }
 *
 * @param query
 * @param state
 */
function filterRelevant<T extends Record<string, any>>(query: IQuery, state: T): IQuery {
    return Object.keys(state).reduce(
        (obj, key) =>
            isEmpty(Array.isArray(state[key]) && typeof query[key] === 'string' ? [query[key]] : query[key])
                ? obj
                : Object.assign(obj, {
                      [key]: Array.isArray(state[key]) && typeof query[key] === 'string' ? [query[key]] : query[key],
                  }),
        {},
    );
}

function toQueryString(obj: any): string {
    return new URLSearchParams(obj).toString();
}

/**
 * Filters out entries if key or value are empty
 *
 * Ex.:
 * obj = { foo: 0, bar: "", baz: [], "": "foo" }
 * returns = { foo: 0 }
 *
 * @param obj
 */
// export function clearEmptyValues<T extends Record<string, any>>(obj: T): T {
export function clearEmptyValues<T extends Record<string, any>>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).filter(([k, v]) => !isEmpty(k) && !isEmpty(v))) as T;
}

function isUpToDate<T extends Record<string, any>>(query: IQuery, state: T, route: IRoute): boolean {
    return (
        toQueryString(clearEmptyValues(filterRouteParams(filterRelevant(query, state), route))) ===
        toQueryString(clearEmptyValues<T>(state))
    );
}

export default function useQueryState<T extends Record<string, any>>(
    defaultState: T,
    resetState?: T,
): [T, Dispatch<SetStateAction<T>>] {
    const { query, replace, route, asPath } = useRouter();
    const prevRoute = usePrevious(route);

    const [state, setState] = useState<T>(
        Object.assign({}, defaultState, filterRouteParams(filterRelevant<T>(query, defaultState), route)),
    );

    useEffect(() => {
        // console.log({ query, state, isUpToDate: isUpToDate(query, state, route) });

        if (!isUpToDate(query, state, route)) {
            // console.log(resetState);

            // Update query string
            replace(
                {
                    pathname: new URL(asPath, 'http://localhost/').pathname,
                    query: clearEmptyValues({
                        ...filterRouteParams(query, route),
                        ...state,
                    }),
                },
                undefined,
                { shallow: true },
            );
        }

        return () => {
            if (prevRoute && route !== prevRoute) {
                replace(
                    {
                        pathname: new URL(asPath, 'http://localhost/').pathname,
                        query: {},
                    },
                    undefined,
                    { shallow: true },
                );
            }
        };
    }, [query, replace, state, asPath, route]);

    return [state, setState];
}
