import { FiSearch } from "react-icons/fi";
import './ActionPanel.css';

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
            <div className="action-search">
                <FiSearch className="action-search-icon" size={20} />
                <input
                    type="text"
                    placeholder={placeholder}
                    className="action-search-input"
                    value={searchTerm}
                    onChange={ (e) => onSearchChange(e.target.value)}
                />
            </div>
        </div>
    );
};

export default ActionPanel;
