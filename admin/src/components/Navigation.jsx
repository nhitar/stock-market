import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="nav-links">
          <Link 
            to="/brokers" 
            className={`nav-link ${location.pathname === '/brokers' ? 'active' : ''}`}
          >
            Брокеры
          </Link>
          <Link 
            to="/stocks" 
            className={`nav-link ${location.pathname === '/stocks' ? 'active' : ''}`}
          >
            Акции
          </Link>
          <Link 
            to="/exchange" 
            className={`nav-link ${location.pathname === '/exchange' ? 'active' : ''}`}
          >
            Биржа
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation