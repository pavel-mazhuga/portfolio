import Link from 'next/link';
import { PropsWithChildren } from 'react';

const ExperimentLayout = ({ children }: PropsWithChildren) => {
    return (
        <div className="experiment">
            <div className="wrapper experiment__top">
                <Link href="/lab">Back</Link>
            </div>
            {children}
        </div>
    );
};

export default ExperimentLayout;
