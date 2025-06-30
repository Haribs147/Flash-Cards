import './ActionPanel.css';
import SearchInput from "../../common/SearchInput/SearchInput";

type ActionPanelProps = {
    searchTerm: string;
    placeholder: string;
    onSearchChange: (value: string) => void;
    onNewFolderClick: () => void;
    onNewSetClick: () => void;
}

const ActionPanel = ({
    searchTerm,
    placeholder,
    onSearchChange,
    onNewFolderClick,
    onNewSetClick,
}: ActionPanelProps) => {
    return (
        <div className="action-panel">
            <div className="action-buttons">
                <button className="action-btn primary" onClick={onNewFolderClick}>
                    Nowy Folder
                </button>
                <button className="action-btn secondary" onClick={onNewSetClick}>
                    Nowy Zestaw Fiszek
                </button>
            </div>
            <SearchInput 
                value={searchTerm}
                onChange={onSearchChange}
                placeholder={placeholder}
            />
        </div>
    );
};

export default ActionPanel;
