import SetsCarousel from "./SetsCarousel/SetsCarousel";
import "./PublicPage.css";

const PublicPage = () => {
    return (
        <main className="public-content">
            <SetsCarousel
                title="Najpopularniejsze"
                showFilters={true}
                carouselType="most_viewed"
            />
            <SetsCarousel
                title="Najbardziej lubiane"
                showFilters={true}
                carouselType="most_liked"
            />
            <SetsCarousel
                title="Najnowsze zestawy"
                showFilters={false}
                carouselType="recently_created"
            />
        </main>
    );
};

export default PublicPage;
