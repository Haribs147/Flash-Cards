import { act, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import SetCard from "../SetCard/SetCard";
import "./SetsCarousel.css";
import {
    fetchMostLikedSets,
    fetchMostViewedSets,
    fetchRecentlyCreatedSets,
    type MostLikedSet,
    type MostRecentSet,
    type MostViewedSet,
    type TimePeriod,
} from "../../../features/publicPage/publicPageService";
import { useQuery } from "@tanstack/react-query";

type SetsCarouselProps = {
    title: string;
    showFilters?: boolean;
    carouselType: "most_viewed" | "most_liked" | "recently_created";
};

const SetsCarousel = ({
    title,
    showFilters = false,
    carouselType,
}: SetsCarouselProps) => {
    const [activeFilter, setActiveFilter] = useState<TimePeriod>("week");

    const queryKey = ["sets", carouselType, activeFilter];

    const queryFn = () => {
        switch (carouselType) {
            case "most_viewed":
                return fetchMostViewedSets(activeFilter);
            case "most_liked":
                return fetchMostLikedSets(activeFilter);
            case "recently_created":
                return fetchRecentlyCreatedSets();
            default:
                return [];
        }
    };

    const {
        data: sets,
        isLoading,
        isError,
    } = useQuery({
        queryKey: queryKey,
        queryFn: queryFn,
        staleTime: carouselType !== "recently_created" ? 1000 * 60 * 5 : 0,
    });

    return (
        <section className="sets-section">
            <div className="section-header">
                <h2 className="section-title">{title}</h2>
                {showFilters && (
                    <div className="filter-bar">
                        <button
                            className={`filter-btn ${activeFilter === "day" ? "active" : ""}`}
                            onClick={() => setActiveFilter("day")}
                        >
                            24h
                        </button>
                        <button
                            className={`filter-btn ${activeFilter === "week" ? "active" : ""}`}
                            onClick={() => setActiveFilter("week")}
                        >
                            Tydzień
                        </button>
                        <button
                            className={`filter-btn ${activeFilter === "month" ? "active" : ""}`}
                            onClick={() => setActiveFilter("month")}
                        >
                            Miesiąc
                        </button>
                        <button
                            className={`filter-btn ${activeFilter === "year" ? "active" : ""}`}
                            onClick={() => setActiveFilter("year")}
                        >
                            Rok
                        </button>
                    </div>
                )}
            </div>
            <div className="carousel-container">
                <button className="nav-arrow prev">
                    <FiChevronLeft size={24} />
                </button>
                <div className="carousel-track">
                    {sets &&
                        sets.map(
                            (
                                set:
                                    | MostLikedSet
                                    | MostViewedSet
                                    | MostRecentSet,
                            ) => (
                                <SetCard
                                    key={set.id}
                                    name={set.name}
                                    description={set.description}
                                    creator={set.creator}
                                />
                            ),
                        )}
                </div>
                <button className="nav-arrow next">
                    <FiChevronRight size={24} />
                </button>
            </div>
        </section>
    );
};

export default SetsCarousel;
