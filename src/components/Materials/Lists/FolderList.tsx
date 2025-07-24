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
    setDraggedItemId: (id: string) => void;
    draggedItemId: string;
    setDraggedItemParentId: (parentId: string | null) => void;
    handleItemClick: (type: string, id: string) => void;
};

const FolderListItem = ({
    item,
    handleItemClick,
    onDragStart,
    draggedItemId,
}: {
    item: MaterialItem;
    handleItemClick: (type: string, id: string) => void;
    onDragStart: (item: MaterialItem) => void;
    draggedItemId: string;
}) => {
    const [isOver, setIsOver] = useState(false);
    const dispatch = useAppDispatch();

    const handleDragDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        if (item.type === "folder" && item.id != draggedItemId) {
            dispatch(
                moveItem({ itemId: draggedItemId, targetFolderId: item.id }),
            );
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (item.type === "folder" && item.id != draggedItemId) {
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
            onDragStart={() => onDragStart(item)}
            key={item.id}
            className={`list-item ${isOver ? "drop-target" : ""}`}
            onClick={() => handleItemClick(item.type, item.id)}
            data-id={item.id}
            data-type={item.type}
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
    setDraggedItemId,
    draggedItemId,
    setDraggedItemParentId,
    handleItemClick,
}: FolderListProps) => {
    const handleDragStart = (item: MaterialItem) => {
        setDraggedItemId(item.id);
        setDraggedItemParentId(item.parentId);
    };

    return (
        <div className="item-list">
            {isCreating && <NewFolderInput onCreate={onCreate} />}

            {filteredItems.map((item) => (
                <FolderListItem
                    item={item}
                    handleItemClick={handleItemClick}
                    onDragStart={handleDragStart}
                    draggedItemId={draggedItemId}
                />
            ))}
        </div>
    );
};

export default FolderList;
