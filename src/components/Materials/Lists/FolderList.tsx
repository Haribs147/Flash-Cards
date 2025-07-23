import { FiFolder, FiFileText } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./FolderList.css";
import NewFolderInput from "../CreateFolderButton/CreateFolder";
import {
    moveItem,
    setCurrentFolderId,
    type MaterialItem,
} from "../../../features/materials/materialsSlice";
import { useAppDispatch } from "../../../app/hooks";
import { useState } from "react";

type FolderListProps = {
    filteredItems: MaterialItem[];
    isCreating: boolean;
    onCreate: (name: string) => void;
};

const FolderListItem = ({
    item,
    onClick,
    onDragStart,
}: {
    item: MaterialItem;
    onClick: (item: MaterialItem) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
}) => {
    const [isOver, setIsOver] = useState(false);
    const dispatch = useAppDispatch();

    const handleDragDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        const draggedItemId = e.dataTransfer.getData("text/plain");
        if (item.type === "folder" && item.id != draggedItemId) {
            dispatch(
                moveItem({ itemId: draggedItemId, targetFolderId: item.id }),
            );
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const draggedItemId = e.dataTransfer.getData("text/plain");
        if (item.type === "folder" && item.id != draggedItemId) {
            console.log(
                "item.id = " + item.id + "draggedItemId = " + draggedItemId,
            );
            setIsOver(true);
        }
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    return (
        <div
            draggable={true}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDragDrop}
            onDragStart={(e) => onDragStart(e, item.id)}
            key={item.id}
            className={`list-item ${isOver ? "drop-target" : ""}`}
            onClick={() => onClick(item)}
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
    );
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
                <FolderListItem
                    item={item}
                    onClick={handleItemClick}
                    onDragStart={handleDragStart}
                />
            ))}
        </div>
    );
};

export default FolderList;
