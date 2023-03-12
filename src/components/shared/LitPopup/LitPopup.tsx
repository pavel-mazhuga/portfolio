'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import LitPopup from 'lit-popup';
import classNames from 'classnames';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/dom';
import { useOpenedPopupsState } from '../../../atoms/opened-popups';
import { LitPopupProps } from './types';

const root = typeof window !== 'undefined' ? document.querySelector('#modal-root') : null;

const LitPopupComponent = ({
    children,
    wrapperChildren,
    containerClass = '',
    name,
    onOpen,
    onOpenComplete,
    onClose,
    onCloseComplete,
    overlay,
    preset = 'default',
    ...props
}: LitPopupProps) => {
    const leaveDurationInSeconds = 0.3;
    const closeAnimationTimeout = useRef<NodeJS.Timeout>();
    const [instance, setInstance] = useState<LitPopup | null>(null);
    const [openedPopups, setOpenedPopups] = useOpenedPopupsState();

    const setPopupCloseAndCheckScrollLock = useCallback(() => {
        setTimeout(() => {
            setOpenedPopups((prevPopups) => {
                const newPopups = prevPopups.filter((popupName) => popupName !== name);

                if (newPopups.length === 0) {
                    unlockBodyScroll();
                }

                return newPopups;
            });
        }, 1);
    }, [name, setOpenedPopups]);

    useEffect(() => {
        const instance = new LitPopup(name, {
            onOpen: () => {
                lockBodyScroll();
                onOpen?.(instance);
            },
            onOpenComplete: () => {
                const focusableOnOpenElement = instance.el.querySelector<HTMLElement>('[data-focus-on-popup-open]');
                setTimeout(() => focusableOnOpenElement?.focus({ preventScroll: true }), 50);
                onOpenComplete?.(instance);
                setOpenedPopups((prevPopups) => Array.from(new Set([...prevPopups, name])));
            },
            onClose: () => {
                onClose?.(instance);
            },
            onCloseComplete: () => {
                onCloseComplete?.(instance);
                setPopupCloseAndCheckScrollLock();
            },
            openAnimation: () =>
                new Promise((resolve) => {
                    clearTimeout(closeAnimationTimeout.current);
                    closeAnimationTimeout.current = setTimeout(resolve, leaveDurationInSeconds * 1000);
                }),
            closeAnimation: () =>
                new Promise((resolve) => {
                    clearTimeout(closeAnimationTimeout.current);
                    closeAnimationTimeout.current = setTimeout(resolve, leaveDurationInSeconds * 1000);
                }),
        });
        setInstance(instance);

        return () => {
            clearTimeout(closeAnimationTimeout.current);
            setPopupCloseAndCheckScrollLock();

            instance.destroy();
            setInstance(null);
        };
    }, [name, onClose, onCloseComplete, onOpen, onOpenComplete, setOpenedPopups, setPopupCloseAndCheckScrollLock]);

    useEffect(() => {
        if (instance) {
            if (openedPopups.includes(name)) {
                if (!instance.isOpen) {
                    instance.open();
                }
            } else {
                if (instance.isOpen) {
                    instance.close();
                }
            }
        }
    }, [openedPopups, instance, name]);

    const Component = (
        <div
            {...props}
            className={classNames('lit-popup', props.className)}
            data-lit-popup={name}
            data-lit-popup-preset={preset}
            data-lit-popup-ignore-inert
        >
            {overlay && <div className="lit-popup-overlay" data-lit-popup-close={name}></div>}
            {wrapperChildren}
            <div className={classNames('lit-popup-container', containerClass)}>{children}</div>
        </div>
    );

    return root ? createPortal(Component, root) : null;
};

export default LitPopupComponent;
