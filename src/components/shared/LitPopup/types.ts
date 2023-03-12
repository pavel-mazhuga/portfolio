import { HTMLAttributes, ReactNode } from 'react';
import type { LitPopupInterface } from 'lit-popup';

export interface LitPopupProps extends HTMLAttributes<HTMLElement> {
    containerClass?: string;
    name: string;
    onOpen?: (instance: LitPopupInterface) => void;
    onOpenComplete?: (instance: LitPopupInterface) => void;
    onClose?: (instance: LitPopupInterface) => void;
    onCloseComplete?: (instance: LitPopupInterface) => void;
    overlay?: boolean;
    preset?: 'default' | 'slide-right';
    wrapperChildren?: ReactNode;
}
