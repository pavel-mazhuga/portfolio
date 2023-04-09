import { useMemo } from 'react';

const Footer = () => {
    const today = useMemo(() => new Date(), []);

    return (
        <footer className="footer wrapper">
            <div>&copy; Pavel Mazhuga, {today.getFullYear()}</div>
        </footer>
    );
};

export default Footer;
