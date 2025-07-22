import { FiFolder, FiFileText } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./FolderList.css";
import NewFolderInput from "../CreateFolderButton/CreateFolder";
import {
    setCurrentFolderId,
    type MaterialItem,
} from "../../../features/materials/materialsSlice";
import { useAppDispatch } from "../../../app/hooks";

type FolderListProps = {
    filteredItems: MaterialItem[];
    isCreating: boolean;
    onCreate: (name: string) => void;
};

const FolderList = ({
    filteredItems,
    isCreating,
    onCreate,
}: FolderListProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleItemClick = (item: MaterialItem) => {
        if (item.type === "set") {
            navigate(`/set/${item.id}`);
        } else {
            dispatch(setCurrentFolderId(item.id));
        }
    };

    const handleDragStart = (
        e: React.DragEvent<HTMLDivElement>,
        itemId: string,
    ) => {
        e.dataTransfer.setData("text/plain", itemId);
    };

    return (
        <div className="item-list">
            {isCreating && <NewFolderInput onCreate={onCreate} />}

            {filteredItems.map((item) => (
                <div
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    key={item.id}
                    className="list-item"
                    onClick={() => handleItemClick(item)}
                >
                    <div className="item-icon">
                        {item.type === "folder" ? (
                            <FiFolder size={22} />
                        ) : (
                            <FiFileText size={22} />
                        )}
                    </div>
                    <span className="item-name">{item.name}</span>
                </div>
            ))}
        </div>
    );
};

export default FolderList;
