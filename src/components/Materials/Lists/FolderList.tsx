import { FiFolder, FiFileText } from "react-icons/fi";
import './FolderList.css';

const mockItems = [
  { id: 'f1', type: 'folder', name: 'Folder 1' },
  { id: 'f2', type: 'folder', name: 'Folder 2' },
  { id: 'f3', type: 'folder', name: 'Folder 3' },
  { id: 's1', type: 'set', name: 'Fiszki 1' },
];

type FolderListProps = {
    searchTerm: string;
}

const FolderList = ({searchTerm}: FolderListProps) => {
    const filteredItems = mockItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
        <div className="item-list">
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
