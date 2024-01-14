import Link from 'next/link';
import { PropsWithChildren } from 'react';
import ErrorBoundary from '@/app/components/layout/ErrorBoundary';
import CodeSVG from '@/svg/code.svg';

type Props = PropsWithChildren & {
    sourceLink?: string;
};

const ExperimentLayout = ({ children, sourceLink }: Props) => {
    return (
        <div className="experiment-page experiment">
            <div className="wrapper experiment__top">
                <Link href="/lab" className="link">
                    Back
                </Link>
                <a
                    href={sourceLink}
                    className="round-btn round-btn-white experiment-src-code-link"
                    aria-label="Source code"
                    target="_blank"
                    rel="noreferrer"
                >
                    <CodeSVG />
                </a>
            </div>
            <ErrorBoundary
                fallback={
                    <div className="experiment-error">
                        <div>Seems that this experiment is broken.</div>
                        <div>
                            See{' '}
                            <Link href="/lab" className="link link--underlined">
                                other experiments
                            </Link>
                        </div>
                    </div>
                }
            >
                {children}
            </ErrorBoundary>
        </div>
    );
};

export default ExperimentLayout;
