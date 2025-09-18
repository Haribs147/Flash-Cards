import { useState } from "react";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

type LayoutProps = {
    children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    return (
        <>
            <Navbar toggleSidebar={toggleSidebar} />
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <main className="main-content">{children}</main>
        </>
    );
};

export default Layout;
