import Link from 'next/link';
import { experiments } from './experiments';

const LabPage = () => {
    return (
        <div>
            <h1 className="lab-page-title">Lab</h1>

            {experiments.length > 0 ? (
                <ul className="list-unstyled experiments-list">
                    {experiments.map((experiment, i) => (
                        <li key={i} className="experiments-list__item">
                            <Link href={`/lab/${experiment.slug}`}>
                                <div>{experiment.name}</div>
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