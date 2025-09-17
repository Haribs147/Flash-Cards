import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

type PublicLayoutProps = {
    children: React.ReactNode;
};

const PublicLayout = ({ children }: PublicLayoutProps) => {
    return (
        <>
            <Navbar />
            <Sidebar />
            <main className="main-content">{children}</main>
        </>
    );
};

export default PublicLayout;
