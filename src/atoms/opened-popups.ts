import { atom, useRecoilState } from 'recoil';

const openedPopupsState = atom<string[]>({
    key: 'openedPopupsState',
    default: [],
});

export const useOpenedPopupsState = () => useRecoilState(openedPopupsState);
