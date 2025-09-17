import { FiHome, FiUser, FiInfo, FiFolder, FiLogIn } from "react-icons/fi";
import "./Sidebar.css";
import { useAppSelector } from "../../app/hooks";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    const navItems = [
        {
            id: "home",
            to: "/",
            icon: <FiHome size={24} />,
            label: "Strona główna",
        },
        ...(isAuthenticated
            ? [
                  {
                      id: "materials",
                      to: "/app/",
                      icon: <FiFolder size={24} />,
                      label: "Materiały",
                  },
                  {
                      id: "profile",
                      to: "/app/profile",
                      icon: <FiUser size={24} />,
                      label: "Profil",
                  },
              ]
            : [
                  {
                      id: "login",
                      to: "/login",

                      icon: <FiLogIn size={24} />,
                      label: "Zaloguj",
                  },
              ]),
    ];
    return (
        <aside className="sidebar">
            <ul className="sidebar-nav-list">
                {navItems.map((item) => (
                    <li key={item.id}>
                        <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                                isActive
                                    ? "sidebar-link active"
                                    : "sidebar-link"
                            }
                            aria-label={item.label}
                        >
                            {item.icon}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar;
