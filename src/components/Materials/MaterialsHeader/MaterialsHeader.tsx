import "./MaterialsHeader.css";

type MaterialsHeaderProps = {
    activeTab: string;
    onTabChange: (tabName: string) => void;
};

const TABS = ["Foldery", "Ostatnie zestawy", "Udostępnione"];

const MaterialsHeader = ({ activeTab, onTabChange }: MaterialsHeaderProps) => {
    return (
        <header className="materials-header">
            <h1 className="materials-title">Twoje materiały</h1>
            <nav className="materials-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        className={`tab-button ${activeTab === tab ? "active" : ""}`}
                        onMouseDown={() => onTabChange(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </nav>
        </header>
    );
};

export default MaterialsHeader;
