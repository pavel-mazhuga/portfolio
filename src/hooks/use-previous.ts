import { useEffect, useRef } from 'react';

export function usePrevious<T = any>(value: T) {
    const ref = useRef<T>();

    useEffect(() => {
        ref.current = value; // assign the value of ref to the argument
    }, [value]); // this code will run when the value of 'value' changes

    return ref.current; // in the end, return the current ref value.
}
