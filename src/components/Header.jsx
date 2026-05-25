import './Header.css';

const Header = () => {
  return (
    <header className="header glass-panel">
      <div className="header-logo">
        <div className="logo-circle"></div>
        <span>Nexus</span>
      </div>
      <nav className="header-nav">
        <a href="#features">Features</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <button className="header-cta">Get Started</button>
    </header>
  );
};

export default Header;
