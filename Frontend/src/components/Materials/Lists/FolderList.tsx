import { FiFolder, FiFileText, FiEdit, FiTrash2 } from "react-icons/fi";
import "./FolderList.css";
import NewFolderInput from "../CreateFolderButton/CreateFolder";
import {
    deleteItem,
    moveItem,
    renameItem,
    type MaterialItem,
} from "../../../features/materials/materialsSlice";
import { useAppDispatch } from "../../../app/hooks";
import { useState, useRef, useEffect } from "react";
import ItemActions from "../../common/ItemActions/ItemActions";

type FolderListProps = {
    filteredItems: MaterialItem[];
    isCreating: boolean;
    currentFolderId: number | null;
    onCreate: (name: string, currentFolderId: number | null) => void;
    setDraggedItemId: (id: number) => void;
    draggedItemId: number;
    setDraggedItemParentId: (parentId: number | null) => void;
    handleItemClick: (item: MaterialItem) => void;
    isSelectMode?: boolean;
};

const FolderListItem = ({
    item,
    handleItemClick,
    onDragStart,
    draggedItemId,
    isSelectMode,
}: {
    item: MaterialItem;
    handleItemClick: (item: MaterialItem) => void;
    onDragStart: (item: MaterialItem) => void;
    draggedItemId: number;
    isSelectMode?: boolean;
}) => {
    const [isOver, setIsOver] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(item.name);

    const dispatch = useAppDispatch();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

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

    const handleRenameClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isEditing) {
            setName(item.name);
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (
            window.confirm(
                `Czy na pewno chcesz usunąć ${item.name} i wszystko co się w nim znajduje?`,
            )
        ) {
            dispatch(deleteItem(item.id));
        }
    };

    const handleSaveRename = () => {
        if (name.trim() !== item.name) {
            dispatch(renameItem({ itemId: item.id, newName: name.trim() }));
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSaveRename();
        } else if (e.key === "Escape") {
            setName(item.name);
            setIsEditing(false);
        }
    };

    const canClick = !isSelectMode || item.item_type === "folder";
    const itemClassName = `list-item ${isOver ? "drop-target" : ""} ${!canClick ? "disabled" : ""}`;
    return (
        <div
            draggable={!isSelectMode}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDragDrop}
            onDragStart={() => onDragStart(item)}
            key={item.id}
            className={itemClassName}
            onClick={() => !isEditing && canClick && handleItemClick(item)}
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
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="item-name-input"
                />
            ) : (
                <span className="item-name">{item.name}</span>
            )}

            {!isSelectMode && (
                <ItemActions
                    onEditClick={handleRenameClick}
                    onDeleteClick={handleDeleteClick}
                />
            )}
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
    isSelectMode = false,
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
                    key={item.id}
                    item={item}
                    handleItemClick={handleItemClick}
                    onDragStart={handleDragStart}
                    draggedItemId={draggedItemId}
                    isSelectMode={isSelectMode}
                />
            ))}
        </div>
    );
};

export default FolderList;
