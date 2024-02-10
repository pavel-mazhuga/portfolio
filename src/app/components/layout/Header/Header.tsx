import Link from 'next/link';

const Header = () => {
    return (
        <header className="header pointer-events-none">
            <div className="wrapper header-wrapper">
                <Link href="/" className="header-logo pointer-events-auto">
                    P.M.
                </Link>
                <div className="header-nav">
                    <ul className="list-unstyled header-nav-list">
                        {/* <li>
                            <Link href="/about" className="link">
                                About me
                            </Link>
                        </li> */}
                        <li>
                            <Link href="/lab" className="link pointer-events-auto">
                                Lab
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
};

export default Header;
