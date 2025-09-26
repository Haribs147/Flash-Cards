import { act, useCallback, useEffect, useRef, useState } from "react";
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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsToShow, setCardsToShow] = useState(0);
    const [cardWidth, setCardWidth] = useState(0);

    const trackRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        setCurrentIndex(0);
    }, [sets, activeFilter]);

    const calculateLayout = useCallback(() => {
        if (containerRef.current && trackRef.current?.firstChild) {
            const containerWidth = containerRef.current.offsetWidth;
            const card = trackRef.current.firstChild as HTMLElement;

            const trackStyle = window.getComputedStyle(trackRef.current);
            const gap = parseFloat(trackStyle.gap) || 16;

            const cardWidth = card.offsetWidth + gap;
            setCardWidth(cardWidth);
            setCardsToShow(Math.floor(containerWidth / cardWidth));
        }
    }, [isLoading]);

    useEffect(() => {
        calculateLayout();
        window.addEventListener("resize", calculateLayout);
        return () => window.removeEventListener("resize", calculateLayout);
    }, [calculateLayout]);

    const handleNext = () => {
        if (!sets) {
            return;
        }
        const maxIndex = Math.max(0, sets.length - cardsToShow);
        setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex));
    };

    const handlePrev = () => {
        if (!sets) {
            return;
        }
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    };

    const maxIndex = sets ? Math.max(0, sets.length - cardsToShow) : 0;

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
            <div className="carousel-container" ref={containerRef}>
                <button
                    className="nav-arrow prev"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                >
                    <FiChevronLeft size={24} />
                </button>
                <div className="carousel-track-wrapper">
                    <div
                        className="carousel-track"
                        ref={trackRef}
                        style={{
                            transform: `translateX(-${currentIndex * cardWidth}px)`,
                        }}
                    >
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
                                        created_at={set.created_at}
                                        view_count={
                                            "view_count" in set
                                                ? set.view_count
                                                : undefined
                                        }
                                        like_count={
                                            "like_count" in set
                                                ? set.like_count
                                                : undefined
                                        }
                                    />
                                ),
                            )}
                    </div>
                </div>
                <button
                    className="nav-arrow next"
                    onClick={handleNext}
                    disabled={currentIndex >= maxIndex}
                >
                    <FiChevronRight size={24} />
                </button>
            </div>
        </section>
    );
};

export default SetsCarousel;
