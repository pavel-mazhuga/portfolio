'use client';

import Link from 'next/link';
import { PropsWithChildren } from 'react';
import ErrorBoundary from '@/app/components/layout/ErrorBoundary';
import CodeSVG from '@/svg/code.svg';

type Props = PropsWithChildren & {
    sourceLink?: string;
    webglVersion?: string;
    webgpuVersion?: string;
};

const ExperimentLayout = ({ children, sourceLink, webglVersion, webgpuVersion }: Props) => {
    return (
        <div className="experiment-page experiment">
            <div className="wrapper experiment__top pointer-events-none">
                <Link href="/lab" className="link pointer-events-auto">
                    Back
                </Link>
                <div className="experiment__top-right">
                    {webglVersion && (
                        <Link href={webglVersion} className="link link--underlined pointer-events-auto experiment-link">
                            WebGL version
                        </Link>
                    )}
                    {webgpuVersion && (
                        <Link
                            href={webgpuVersion}
                            className="link link--underlined pointer-events-auto experiment-link"
                        >
                            WebGPU version
                        </Link>
                    )}
                    <a
                        href={sourceLink}
                        className="round-btn round-btn-white experiment-src-code-link pointer-events-auto"
                        aria-label="Source code"
                        title="Source code"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <CodeSVG />
                    </a>
                </div>
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
