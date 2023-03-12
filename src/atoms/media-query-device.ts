import { atom, useRecoilState } from 'recoil';

export const mediaQueryDeviceState = atom<
    'horizontal-mobile' | 'vertical-mobile' | 'horizontal-tablet' | 'vertical-tablet' | 'desktop'
>({
    key: 'mediaQueryDeviceState',
    default: 'desktop',
});

export const useMediaQueryDeviceState = () => useRecoilState(mediaQueryDeviceState);
