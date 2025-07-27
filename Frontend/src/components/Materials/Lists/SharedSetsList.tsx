import "./SharedSetsList.css";
import { FiCheck, FiX } from "react-icons/fi";
import "./RecentSetsList.css";
import "./SharedSetsList.css";

const mockSharedSets = [
    { id: "s1", name: "Fiszki 1", authorInitial: "M", color: "#007bff" },
    { id: "s2", name: "Fiszki 2", authorInitial: "J", color: "#dc3545" },
];

type SharedSetsListProps = {
    searchTerm: string;
};

const SharedSetsList = ({ searchTerm }: SharedSetsListProps) => {
    const filteredSets = mockSharedSets.filter((set) =>
        set.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return (
        <div className="item-list">
            {filteredSets.map((set) => (
                <div key={set.id} className="list-item-set">
                    <div
                        className="set-avatar"
                        style={{ backgroundColor: set.color }}
                    >
                        {set.authorInitial}
                    </div>
                    <span className="item-name">{set.name}</span>
                    <div className="shared-actions">
                        <button className="shared-btn accept">
                            <FiCheck />
                        </button>
                        <button className="shared-btn reject">
                            <FiX />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SharedSetsList;
