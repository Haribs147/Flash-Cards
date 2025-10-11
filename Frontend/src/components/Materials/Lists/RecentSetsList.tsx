import { useEffect, useState } from "react";
import "./RecentSetsList.css";
import axios from "axios";
import { getRecentSetsApi } from "../../../features/materials/materialsService";

type RecentSetsListProps = {
    searchTerm: string;
};

type RecentSet = {
    id: number;
    name: string;
    author_initial: string;
    viewed_at: string;
};

type GroupedSets = {
    [date: string]: RecentSet[];
};
const RecentSetsList = ({ searchTerm }: RecentSetsListProps) => {
    const [groupedSets, setGroupedSets] = useState<GroupedSets>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLastViewedSets = async () => {
            try {
                const data = await getRecentSetsApi();

                const groups: GroupedSets = data.sets.reduce(
                    (
                        acc: { [x: string]: any[] },
                        set: { viewed_at: string | number | Date },
                    ) => {
                        const date = new Date(set.viewed_at);
                        const formattedDate = date.toLocaleDateString(
                            undefined,
                            {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            },
                        );

                        if (!acc[formattedDate]) {
                            acc[formattedDate] = [];
                        }
                        acc[formattedDate].push(set);
                        return acc;
                    },
                    {} as GroupedSets,
                );
                setGroupedSets(groups);
            } catch (error) {
                console.error("Error fetching recent sets");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLastViewedSets();
    }, []);

    const filteredGroupedSets = Object.entries(groupedSets).reduce(
        (acc, [date, sets]) => {
            const filtered = sets.filter((set) =>
                set.name.toLowerCase().includes(searchTerm.toLowerCase()),
            );
            if (filtered.length > 0) {
                acc[date] = filtered;
            }
            return acc;
        },
        {} as GroupedSets,
    );

    if (isLoading) {
        return <div></div>;
    }

    return (
        <div className="recent-sets-container">
            {Object.entries(filteredGroupedSets).map(([date, setsOnDate]) => (
                <div key={date} className="date-group">
                    <h3 className="date-header">{date}</h3>
                    <div className="item-list">
                        {setsOnDate.map((set) => (
                            <div key={set.id} className="list-item-set">
                                <div
                                    className="set-avatar"
                                    style={{ backgroundColor: "blue" }}
                                >
                                    {set.author_initial}
                                </div>
                                <span className="item-name">{set.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecentSetsList;
