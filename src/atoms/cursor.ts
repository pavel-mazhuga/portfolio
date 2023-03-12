import { ReactNode } from 'react';
import { atom, useRecoilState } from 'recoil';

/**
 * Cursor type
 */

type CursorType = 'default' | 'close' | 'link';

const cursorTypeState = atom<CursorType>({
    key: 'cursorTypeState',
    default: 'default',
});

export const useCursorTypeState = () => useRecoilState(cursorTypeState);

/**
 * Cursor content
 */

const cursorContentState = atom<ReactNode>({
    key: 'cursorContentState',
    default: null,
});

export const useCursorContentState = () => useRecoilState(cursorContentState);
