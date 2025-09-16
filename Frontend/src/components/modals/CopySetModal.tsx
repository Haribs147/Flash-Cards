import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    fetchAllMaterials,
    type MaterialItem,
} from "../../features/materials/materialsSlice";
import Breadcrumbs from "../Materials/Breadcrumbs/Breadcrumbs";
import FolderList from "../Materials/Lists/FolderList";

import "./CopySetModal.css";

type CopySetModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (targetFolderId: number | null) => void;
};

const CopySetModal = ({ isOpen, onClose, onConfirm }: CopySetModalProps) => {
    const dispatch = useAppDispatch();

    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

    const { items, status, error } = useAppSelector((state) => state.materials);

    useEffect(() => {
        if (isOpen && status === "idle") {
            dispatch(fetchAllMaterials());
        }
    }, [isOpen, status, dispatch]);

    const handleItemClick = (item: MaterialItem) => {
        if (item.item_type === "folder") {
            setCurrentFolderId(item.id);
        }
    };

    if (!isOpen) {
        return null;
    }

    const filteredItems = items.filter(
        (item) => item.parent_id === currentFolderId,
    );

    if (status === "loading" || status === "failed") {
        return <div></div>;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Skopiuj do ...</h2>
                <div className="folder-browser">
                    <Breadcrumbs
                        currentFolderId={currentFolderId}
                        onNavigate={setCurrentFolderId}
                    />
                    {status === "succeded" && (
                        <FolderList
                            filteredItems={filteredItems}
                            isSelectMode={true}
                            handleItemClick={handleItemClick}
                            isCreating={false}
                            currentFolderId={currentFolderId}
                            onCreate={() => {}}
                            setDraggedItemId={() => {}}
                            draggedItemId={-1}
                            setDraggedItemParentId={() => {}}
                        />
                    )}
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary">
                        Anuluj
                    </button>
                    <button
                        onClick={() => onConfirm(currentFolderId)}
                        className="btn-primary"
                    >
                        Skopiuj
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CopySetModal;
