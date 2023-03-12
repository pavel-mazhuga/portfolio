/**
 * Все провайдеры подключаются в этом файле.
 */

'use client';

import { ReactNode } from 'react';
import { RecoilRoot } from 'recoil';

const Providers = ({ children }: { children: ReactNode }) => {
    return <RecoilRoot>{children}</RecoilRoot>;
};

export default Providers;
