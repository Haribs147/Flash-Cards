import { FiMenu } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">

      <div className="navbar-left">
        <button className="navbar-button">
          <FiMenu size={24} />
        </button>
        <div className="navbar-logo">F</div>
      </div>

      {/* --- Sekcja środkowa (wyszukiwarka) --- */}
      {/* <div className="navbar-center">
        <div className="search-container">
          <FiSearch className="search-icon" size={20} />
          <input type="text" placeholder="Szukaj" className="search-input" />
        </div>
      </div> */}

      <div className="navbar-right">
        <div className="user-avatar">M</div>
      </div>
    </nav>
  );
};

export default Navbar;