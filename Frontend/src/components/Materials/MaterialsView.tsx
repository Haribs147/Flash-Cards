import MaterialsHeader from "./MaterialsHeader/MaterialsHeader";
import ActionPanel from "./ActionPanel/ActionPanel";
import "./MaterialsView.css";
import FolderList from "./Lists/FolderList";
import RecentSetsList from "./Lists/RecentSetsList";
import SharedSetsList from "./Lists/SharedSetsList";
import SearchInput from "../common/SearchInput/SearchInput";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    createFolder,
    fetchAllMaterials,
    setActiveTab,
    setCurrentFolderId,
    setIsCreating,
    setSearchTerm,
    type MaterialItem,
} from "../../features/materials/materialsSlice";
import Breadcrumbs from "./Breadcrumbs/Breadcrumbs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MaterialsView = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const {
        items,
        activeTab,
        searchTerm,
        isCreatingFolder,
        currentFolderId,
        status,
        error,
    } = useAppSelector((state) => state.materials);

    const [draggedItemId, setDraggedItemId] = useState(-1);
    const [draggedItemParentId, setDraggedItemParentId] = useState<
        number | null
    >(null);

    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchAllMaterials());
        }
    }, [status, dispatch]);

    const handleNewFolder = () => {
        if (isCreatingFolder) {
            dispatch(setIsCreating(false));
            return;
        }
        dispatch(setIsCreating(true));
    };

    const handleCreateFolder = (
        folderName: string,
        currentFolderId: number | null,
    ) => {
        if (folderName.trim() === "") {
            dispatch(setIsCreating(false));
            return;
        }
        dispatch(
            createFolder({ name: folderName, parent_id: currentFolderId }),
        );
    };

    const handleItemClick = (item_type: string, id: number) => {
        if (item_type === "set") {
            navigate(`/set/${id}`);
        } else {
            dispatch(setCurrentFolderId(id));
        }
    };

    // Use effect to handle creating folder button onBlur
    useEffect(() => {
        const handleGlobalMouseDown = (event: MouseEvent) => {
            if (!isCreatingFolder) {
                return;
            }

            const target = event.target as HTMLElement;
            const clickedItemDiv = target.closest<HTMLElement>(
                ".list-item:not(.new-item)",
            );

            if (clickedItemDiv) {
                const id = clickedItemDiv.dataset.id;
                const item_type = clickedItemDiv.dataset.type;
                if (id && item_type) {
                    handleItemClick(item_type, parseInt(id, 10));
                }
            }

            if (target.closest("#new-folder-button")) {
                return;
            }

            if (target.closest(".new-item")) {
                return;
            }

            dispatch(setIsCreating(false));
        };
        document.addEventListener("mousedown", handleGlobalMouseDown);

        return () => {
            document.removeEventListener("mousedown", handleGlobalMouseDown);
        };
    }, [isCreatingFolder, dispatch]);

    const filteredItems = items
        .filter((item) => currentFolderId === item.parent_id)
        .filter((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );

    const getSearchPlaceholder = () => {
        switch (activeTab) {
            case "Ostatnie zestawy":
                return "Przeszukaj ostatnie zestawy";
            case "Udostępnione":
                return "Przeszukaj udostępnione";
            case "Foldery":
            default:
                return "Przeszukaj materiały";
        }
    };

    const renderActionPanel = () => {
        const placeholder = getSearchPlaceholder();
        switch (activeTab) {
            case "Foldery":
                return (
                    <ActionPanel
                        searchTerm={searchTerm}
                        placeholder={placeholder}
                        onSearchChange={(value) =>
                            dispatch(setSearchTerm(value))
                        }
                        onNewFolderClick={handleNewFolder}
                    />
                );
            default:
                return (
                    <SearchInput
                        value={searchTerm}
                        onChange={(value) => dispatch(setSearchTerm(value))}
                        placeholder={placeholder}
                    />
                );
        }
    };

    const renderList = () => {
        switch (activeTab) {
            case "Ostatnie zestawy":
                return <RecentSetsList searchTerm={searchTerm} />;
            case "Udostępnione":
                return <SharedSetsList searchTerm={searchTerm} />;
            case "Foldery":
            default:
                if (status === "loading") {
                    return <div></div>;
                }

                if (status === "failed") {
                    return <div>Error loading materials: {error}</div>;
                }

                return (
                    <FolderList
                        filteredItems={filteredItems}
                        isCreating={isCreatingFolder}
                        currentFolderId={currentFolderId}
                        onCreate={handleCreateFolder}
                        setDraggedItemId={setDraggedItemId}
                        draggedItemId={draggedItemId}
                        setDraggedItemParentId={setDraggedItemParentId}
                        handleItemClick={handleItemClick}
                    />
                );
        }
    };

    return (
        <div className="materials-view">
            <MaterialsHeader
                activeTab={activeTab}
                onTabChange={(tab) => dispatch(setActiveTab(tab))}
            />
            {renderActionPanel()}
            {activeTab === "Foldery" && (
                <Breadcrumbs
                    draggedItemId={draggedItemId}
                    draggedItemParentId={draggedItemParentId}
                />
            )}
            {renderList()}
        </div>
    );
};

export default MaterialsView;
