import { FiFolder, FiFileText } from "react-icons/fi";
import './FolderList.css';
import NewFolderInput from "../CreateFolderButton/CreateFolder";

type FolderListProps = {
    items: Array<{id: string, type: string, name: string}>;
    searchTerm: string;
    isCreating: boolean;
    onCreate: (name: string) => void;
}

const FolderList = ({items, searchTerm, isCreating, onCreate}: FolderListProps) => {
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
        <div className="item-list">
            {isCreating && <NewFolderInput onCreate={onCreate} />}

            {filteredItems.map(item => (
                <div key = {item.id} className="list-item">
                    <div className="item-icon">
                        {item.type === 'folder' ? <FiFolder size={22}/> : <FiFileText size={22} />}
                    </div>
                    <span className="item-name">{item.name}</span>
                </div>
            ))}
        </div>
    );
};

export default FolderList;
