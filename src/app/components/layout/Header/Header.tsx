import Link from 'next/link';

const Header = () => {
    return (
        <header className="header">
            <div className="wrapper header-wrapper">
                <Link href="/" className="header-logo">
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
                            <Link href="/lab" className="link">
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
