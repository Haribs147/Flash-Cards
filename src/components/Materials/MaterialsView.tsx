import {useState} from "react";
import MaterialsHeader from "./MaterialsHeader/MaterialsHeader";
import ActionPanel from "./ActionPanel/ActionPanel";
import './MaterialsView.css';
import FolderList from "./Lists/FolderList";
import RecentSetsList from "./Lists/RecentSetsList";
import SharedSetsList from "./Lists/SharedSetsList";
import SearchInput from "../common/SearchInput/SearchInput";

const MaterialsView = () => {
    const [activeTab, setActiveTab] = useState('Foldery');
    const [searchTerm, setSearchTerm] = useState('');

    const handleNewFolder = () => {
        console.log("here logic of creating a new folder");
    }

    const handleNewSet = () => {
        console.log("here logic of creating a new set");
    }

    const getSearchPlaceholder = () => {
        switch (activeTab) {
            case 'Ostatnie zestawy':
                return 'Przeszukaj ostatnie zestawy';
            case 'Udostępnione':
                return 'Przeszukaj udostępnione';
            case 'Foldery':
            default:
                return 'Przeszukaj materiały';
        }
    };

    const renderActionPanel = () => {
        const placeholder = getSearchPlaceholder();
        switch (activeTab) {
            case 'Foldery':
                return <ActionPanel
                            searchTerm={searchTerm}
                            placeholder={placeholder}
                            onSearchChange={setSearchTerm}
                            onNewFolderClick={handleNewFolder}
                            onNewSetClick={handleNewSet}
                        />
            default:
                return <SearchInput 
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder={placeholder}
                        />
            }
    };


    const renderList = () => {
        switch (activeTab) {
            case 'Ostatnie zestawy':
                return <RecentSetsList searchTerm={searchTerm} />;
            case 'Udostępnione':
                return <SharedSetsList searchTerm={searchTerm} />;
            case 'Foldery':
            default:
                return <FolderList searchTerm={searchTerm} />;
            }
    };

    return(
        <div className="materials-view">
            <MaterialsHeader activeTab={activeTab} onTabChange={setActiveTab}/>
            {renderActionPanel()}
            {renderList()}
        </div>
    );
};

export default MaterialsView;