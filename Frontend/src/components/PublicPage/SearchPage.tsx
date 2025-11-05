import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SetCard from "./SetCard/SetCard";
import "./SearchPage.css";

type SearchResult = {
    id: number;
    name: string;
    description: string;
    creator: string;
    created_at: string;
    tags: string[];
};

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q");

    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.post(
                    `http://localhost:8000/public/search?text_query=${encodeURIComponent(query)}`,
                );
                const data: SearchResult[] = response.data;
                setResults(data);
            } catch (err) {
                let errorMessage = "Error message";
                if (axios.isAxiosError(err)) {
                    errorMessage = err.response?.data?.detail || err.message;
                } else if (err instanceof Error) {
                    errorMessage = err.message;
                }
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [query]);
    if (isLoading) {
        return <div></div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }
    if (results.length == 0) {
        return (
            <p>
                Nie znaleziono żadnych materiałów pasujących do zapytania:{" "}
                {query}
            </p>
        );
    }

    return (
        <div className="search-results-container">
            <h1>Wyniki dla zapytania: {query}</h1>
            <div className="results-grid">
                {results.map((set) => (
                    <SetCard
                        key={set.id}
                        id={set.id}
                        name={set.name}
                        description={set.description}
                        creator={set.creator}
                        created_at={set.created_at}
                    />
                ))}
            </div>
        </div>
    );
};

export default SearchPage;
