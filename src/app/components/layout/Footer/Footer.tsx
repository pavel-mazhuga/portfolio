const Footer = () => {
    return (
        <footer className="footer wrapper pointer-events-none">
            {/* <a
                href="https://t.me/pavelmazhuga"
                target="_blank"
                rel="noreferrer"
                className="link link--underlined footer-availability pointer-events-auto"
            >
                Available for work from February 2025
            </a> */}
            <ul className="list-unstyled soc-list footer-soc-list pointer-events-auto">
                <li className="soc-list__item">
                    <a href="https://www.instagram.com/mazhuga.gl/" target="_blank" rel="noreferrer" className="link">
                        Instagram
                    </a>
                </li>
                <li className="soc-list__item">
                    <a href="https://t.me/mazhugagl" target="_blank" rel="noreferrer" className="link">
                        Telegram
                    </a>
                </li>
                <li className="soc-list__item">
                    <a href="https://x.com/PMazhuga" target="_blank" rel="noreferrer" className="link">
                        Twitter
                    </a>
                </li>
                <li className="soc-list__item">
                    <a href="https://github.com/pavel-mazhuga/" target="_blank" rel="noreferrer" className="link">
                        Github
                    </a>
                </li>
            </ul>
        </footer>
    );
};

export default Footer;
