import "./RecentSetsList.css";

const mockSets = [
  { id: "s1", name: "Fiszki 1", authorInitial: "M", color: "#007bff" },
  { id: "s2", name: "Fiszki 2", authorInitial: "J", color: "#dc3545" },
  { id: "s3", name: "Fiszki 3", authorInitial: "A", color: "#ffc107" },
];

type RecentSetsListProps = {
  searchTerm: string;
};

const RecentSetsList = ({ searchTerm }: RecentSetsListProps) => {
  const filteredSets = mockSets.filter((set) =>
    set.name.toLowerCase().includes(searchTerm.toLocaleLowerCase()),
  );

  return (
    <div className="item-list">
      {filteredSets.map((set) => (
        <div key={set.id} className="list-item-set">
          <div className="set-avatar" style={{ backgroundColor: set.color }}>
            {set.authorInitial}
          </div>
          <span className="item-name">{set.name}</span>
        </div>
      ))}
    </div>
  );
};

export default RecentSetsList;
