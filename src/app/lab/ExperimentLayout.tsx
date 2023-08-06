import Link from 'next/link';
import { PropsWithChildren } from 'react';
import ErrorBoundary from '@/components/layout/ErrorBoundary';

const ExperimentLayout = ({ children }: PropsWithChildren) => {
    return (
        <div className="experiment">
            <div className="wrapper experiment__top">
                <Link href="/lab" className="link">
                    Back
                </Link>
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
