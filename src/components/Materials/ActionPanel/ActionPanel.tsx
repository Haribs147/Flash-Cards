import { useNavigate } from "react-router-dom";
import "./ActionPanel.css";
import SearchInput from "../../common/SearchInput/SearchInput";

type ActionPanelProps = {
    searchTerm: string;
    placeholder: string;
    onSearchChange: (value: string) => void;
    onNewFolderClick: () => void;
};

const ActionPanel = ({
    searchTerm,
    placeholder,
    onSearchChange,
    onNewFolderClick,
}: ActionPanelProps) => {
    const navigate = useNavigate();
    const handleNewSetClick = () => {
        navigate("/new-set");
    };

    return (
        <div className="action-panel">
            <div className="action-buttons">
                <button
                    className="action-btn primary"
                    id="new-folder-button"
                    onClick={onNewFolderClick}
                >
                    Nowy Folder
                </button>
                <button
                    className="action-btn secondary"
                    onMouseDown={handleNewSetClick}
                >
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
