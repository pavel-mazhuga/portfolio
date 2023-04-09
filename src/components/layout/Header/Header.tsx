const Header = () => {
    return (
        <header className="header">
            <div className="wrapper header-wrapper">
                <div className="header-logo">P.M.</div>
                <nav className="header-nav">
                    <ul className="list-unstyled header-nav-list">
                        <li>
                            <a href="#">About me</a>
                        </li>
                        <li>
                            <a href="#portfolio">Portfolio</a>
                        </li>
                        <li>
                            <a href="#contacts">Contacts</a>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;
