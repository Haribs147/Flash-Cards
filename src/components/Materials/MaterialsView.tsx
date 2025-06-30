import {useState} from "react";
import MaterialsHeader from "./MaterialsHeader/MaterialsHeader";
import ActionPanel from "./ActionPanel/ActionPanel";
import './MaterialsView.css';
import FolderList from "./Lists/FolderList";

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

    const renderContent = () => {
        switch (activeTab) {
            case 'Ostatnie zestawy':
                //return <RecentSetsList searchTerm={searchTerm} />;
            case 'Udostępnione':
                //return <SharedSetsList searchTerm={searchTerm} />;
            case 'Foldery':
            default:
                return <FolderList searchTerm={searchTerm} />;
            }
    };


    return(
        <div className="materials-view">
            <MaterialsHeader activeTab={activeTab} onTabChange={setActiveTab}/>
            <ActionPanel
                searchTerm={searchTerm}
                placeholder={getSearchPlaceholder()}
                onSearchChange={setSearchTerm}
                onNewFolderClick={handleNewFolder}
                onNewSetClick={handleNewSet}
            />
            {renderContent()}
        </div>
    );
};

export default MaterialsView;