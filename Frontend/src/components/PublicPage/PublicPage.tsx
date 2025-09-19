import SetsCarousel from "./SetsCarousel/SetsCarousel";
import "./PublicPage.css";

const PublicPage = () => {
    return (
        <main className="public-content">
            <SetsCarousel title="Najpopularniejsze" showFilters={true} />
            <SetsCarousel title="Najbardziej lubiane" showFilters={true} />
            <SetsCarousel title="Najnowsze zestawy" showFilters={false} />
        </main>
    );
};

export default PublicPage;
