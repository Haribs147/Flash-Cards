import { FiFolder, FiFileText } from "react-icons/fi";
import "./FolderList.css";
import NewFolderInput from "../CreateFolderButton/CreateFolder";
import {
    moveItem,
    type MaterialItem,
} from "../../../features/materials/materialsSlice";
import { useAppDispatch } from "../../../app/hooks";
import { useState } from "react";

type FolderListProps = {
    filteredItems: MaterialItem[];
    isCreating: boolean;
    currentFolderId: number | null;
    onCreate: (name: string, currentFolderId: number | null) => void;
    setDraggedItemId: (id: number) => void;
    draggedItemId: number;
    setDraggedItemParentId: (parentId: number | null) => void;
    handleItemClick: (item_type: string, id: number) => void;
};

const FolderListItem = ({
    item,
    handleItemClick,
    onDragStart,
    draggedItemId,
}: {
    item: MaterialItem;
    handleItemClick: (item_type: string, id: number) => void;
    onDragStart: (item: MaterialItem) => void;
    draggedItemId: number;
}) => {
    const [isOver, setIsOver] = useState(false);
    const dispatch = useAppDispatch();

    const handleDragDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        if (item.item_type === "folder" && item.id != draggedItemId) {
            dispatch(
                moveItem({ itemId: draggedItemId, targetFolderId: item.id }),
            );
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (item.item_type === "folder" && item.id != draggedItemId) {
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
            onClick={() => handleItemClick(item.item_type, item.id)}
            data-id={item.id}
            data-type={item.item_type}
        >
            <div className="item-icon">
                {item.item_type === "folder" ? (
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
    currentFolderId,
    onCreate,
    setDraggedItemId,
    draggedItemId,
    setDraggedItemParentId,
    handleItemClick,
}: FolderListProps) => {
    const handleDragStart = (item: MaterialItem) => {
        setDraggedItemId(item.id);
        setDraggedItemParentId(item.parent_id);
    };

    return (
        <div className="item-list">
            {isCreating && (
                <NewFolderInput
                    onCreate={onCreate}
                    currentFolderId={currentFolderId}
                />
            )}

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
