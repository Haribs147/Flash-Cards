import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import SetCard from "../SetCard/SetCard";
import "./SetsCarousle.css";

type SetsCarouselProps = {
    title: string;
    showFilters?: boolean;
};

const SetsCarousel = ({ title, showFilters = false }: SetsCarouselProps) => {
    const [activeFilter, setActiveFilter] = useState("week");

    const sets = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        name: "Nazwa zestawuaaaaaaaaaaaaaaaaaaa aaaaaaaa aaa",
        description:
            "Cos Cos  Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos Cos ",
        initial: "M",
    }));

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
                    {sets.map((set) => (
                        <SetCard
                            key={set.id}
                            name={set.name}
                            description={set.description}
                            initial={set.initial}
                        />
                    ))}
                </div>
                <button className="nav-arrow next">
                    <FiChevronRight size={24} />
                </button>
            </div>
        </section>
    );
};

export default SetsCarousel;
