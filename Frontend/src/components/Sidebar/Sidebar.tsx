import { FiHome, FiUser, FiInfo, FiFolder } from "react-icons/fi";
import "./Sidebar.css";

type SidebarProps = {
    activeItem: string;
    onItemClick: (item: string) => void;
};

const navItems = [
    { id: "home", icon: <FiHome size={24} />, label: "Strona główna" },
    { id: "profile", icon: <FiUser size={24} />, label: "Profil" },
    { id: "info", icon: <FiInfo size={24} />, label: "Informacje" },
    { id: "folders", icon: <FiFolder size={24} />, label: "Twoje materiały" },
];

const Sidebar = ({ activeItem, onItemClick }: SidebarProps) => {
    return (
        <aside className="sidebar">
            <ul className="sidebar-nav-list">
                {navItems.map((item) => (
                    <li key={item.id}>
                        <button
                            className={
                                activeItem === item.id
                                    ? "sidebar-link active"
                                    : "sidebar-link"
                            }
                            onClick={() => onItemClick(item.id)}
                            aria-label={item.label}
                        >
                            {item.icon}
                        </button>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar;
