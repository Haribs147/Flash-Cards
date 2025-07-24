import MaterialsHeader from "./MaterialsHeader/MaterialsHeader";
import ActionPanel from "./ActionPanel/ActionPanel";
import "./MaterialsView.css";
import FolderList from "./Lists/FolderList";
import RecentSetsList from "./Lists/RecentSetsList";
import SharedSetsList from "./Lists/SharedSetsList";
import SearchInput from "../common/SearchInput/SearchInput";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    addFolder,
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
    const { items, activeTab, searchTerm, isCreatingFolder, currentFolderId } =
        useAppSelector((state) => state.materials);

    const [draggedItemId, setDraggedItemId] = useState("");
    const [draggedItemParentId, setDraggedItemParentId] = useState<
        string | null
    >("");

    const handleNewFolder = () => {
        console.log("here logic of creating a new folder");
        if (isCreatingFolder) {
            dispatch(setIsCreating(false));
            return;
        }
        dispatch(setIsCreating(true));
    };

    const handleCreateFolder = (folderName: string) => {
        dispatch(addFolder(folderName));
    };

    const handleItemClick = (type: string, id: string) => {
        if (type === "set") {
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
                const type = clickedItemDiv.dataset.type;
                console.log("id = " + id);
                console.log("type = " + type);
                if (id && type) {
                    handleItemClick(type, id);
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
        .filter((item) => currentFolderId === item.parentId)
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
                return (
                    <FolderList
                        filteredItems={filteredItems}
                        isCreating={isCreatingFolder}
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
