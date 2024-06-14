import classNames from 'classnames';
import { Children, HTMLAttributes, ReactElement, cloneElement, isValidElement } from 'react';

interface Props extends HTMLAttributes<HTMLElement> {}

const Responsive = ({ children, ...props }: Props) => {
    return (
        <div {...props} className={classNames(props.className, 'responsive')}>
            {Children.map(
                children,
                (child) =>
                    isValidElement(child) &&
                    cloneElement(child as ReactElement<Props>, {
                        className: classNames(child.props.className, 'responsive__item'),
                    }),
            )}
        </div>
    );
};

export default Responsive;
