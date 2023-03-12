import { ButtonHTMLAttributes, forwardRef, createElement } from 'react';
import classNames from 'classnames';

export interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * Какой тег рендерить
     */
    tag?: keyof JSX.IntrinsicElements;
    /**
     * Геометрия кнопки
     */
    geometryVariant?: 'default' | 'wide';
    /**
     * Цветовая тема кнопки
     */
    variant?: 'default' | 'primary';
}

const Button = forwardRef<HTMLButtonElement, Props>(
    ({ children, variant = 'default', tag = 'button', geometryVariant = 'default', ...props }, ref) => {
        return createElement(
            tag,
            {
                ...props,
                ref,
                className: classNames('btn', `btn-${variant}`, `btn-geometry-${variant}`, props.className),
            },
            children,
        );
    },
);

Button.displayName = 'Button';

export default Button;
