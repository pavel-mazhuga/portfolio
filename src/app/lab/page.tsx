import { Metadata } from 'next';
import Link from 'next/link';
import { experiments } from './data';
import Image from 'next/image';
import Responsive from '@/components/shared/Responsive/Responsive';

export const metadata: Metadata = {
    title: 'Lab',
    description: 'Creative demos and concepts: WebGL, Canvas2D, SVG, you name it.',
};

const LabPage = () => {
    return (
        <div className="wrapper">
            <h1 className="lab-page-title">Lab</h1>

            {experiments.length > 0 ? (
                <ul className="list-unstyled experiments-list">
                    {experiments.map((experiment, i) => (
                        <li key={i} className="experiments-list__item">
                            <Link href={`/lab/${experiment.slug}`} className="experiments-list-item">
                                <Responsive className="experiments-list-item__img-wrapper">
                                    {experiment.preview && <Image {...experiment.preview} alt={experiment.name} />}
                                </Responsive>
                                <div className="experiments-list-item__name">{experiment.name}</div>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <div>Nothing here yet, but stay tuned!</div>
            )}
        </div>
    );
};

export default LabPage;
