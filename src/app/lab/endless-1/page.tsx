import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Endless shader experiment',
    description: 'A shader experiment',
};

const Endless1Page = () => {
    return <Experience />;
};

export default Endless1Page;
