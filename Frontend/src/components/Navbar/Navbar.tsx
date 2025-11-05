import { FiMenu, FiSearch } from "react-icons/fi";
import "./Navbar.css";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../features/auth/authSlice";
import { useState } from "react";

type NavbarProps = {
    toggleSidebar: () => void;
};

const Navbar = ({ toggleSidebar }: NavbarProps) => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");

    const handleLogout = () => {
        navigate("/");
        dispatch(logoutUser());
    };

    const handleLogin = () => {
        navigate("/login");
    };

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchText.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
        }
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

            <div className="navbar-center">
                <div className="search-container">
                    <FiSearch className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Szukaj"
                        className="search-input"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>
            </div>

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
