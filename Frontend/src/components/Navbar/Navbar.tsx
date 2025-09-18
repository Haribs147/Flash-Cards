import { FiMenu } from "react-icons/fi";
import "./Navbar.css";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../features/auth/authSlice";

type NavbarProps = {
    toggleSidebar: () => void;
};

const Navbar = ({ toggleSidebar }: NavbarProps) => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/");
    };

    const handleLogin = () => {
        navigate("/login");
    };

    const avatar = user?.email ? user.email[0].toUpperCase() : "?";

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button className="navbar-button" onClick={toggleSidebar}>
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
                {isAuthenticated ? (
                    <>
                        <button
                            onClick={handleLogout}
                            className="navbar-action-button logout"
                        >
                            Wyloguj
                        </button>
                        <div className="user-avatar">{avatar}</div>
                    </>
                ) : (
                    <button
                        onClick={handleLogin}
                        className="navbar-action-button login"
                    >
                        Zaloguj
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
