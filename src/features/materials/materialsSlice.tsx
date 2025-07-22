import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Define a type for a single item
export interface MaterialItem {
    id: string;
    type: "folder" | "set";
    name: string;
    parentId: string | null;
}

// Define a type for the slice state
interface MaterialsState {
    items: MaterialItem[];
    activeTab: string;
    searchTerm: string;
    isCreatingFolder: boolean;
    currentFolderId: string | null;
}

const initialItems: MaterialItem[] = [
    { id: "f1", type: "folder", name: "Folder 1", parentId: null },
    { id: "f2", type: "folder", name: "Folder 2", parentId: null },
    { id: "f3", type: "folder", name: "Folder 3", parentId: null },
    { id: "s1", type: "set", name: "Fiszki 1", parentId: null },
];

// Define the initial state using that type
const initialState: MaterialsState = {
    items: initialItems,
    activeTab: "Foldery",
    searchTerm: "",
    isCreatingFolder: false,
    currentFolderId: null,
};

export const materialsSlice = createSlice({
    name: "materials",
    initialState,
    reducers: {
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTab = action.payload;
        },
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload;
        },
        setIsCreating: (state, action: PayloadAction<boolean>) => {
            state.isCreatingFolder = action.payload;
        },
        addFolder: (state, action: PayloadAction<string>) => {
            if (action.payload.trim() !== "") {
                const newFolder: MaterialItem = {
                    id: `f-${Date.now()}`,
                    type: "folder",
                    name: action.payload.trim(),
                    parentId: state.currentFolderId,
                };
                state.items.unshift(newFolder);
            }
            state.isCreatingFolder = false;
        },
        setCurrentFolderId: (state, action: PayloadAction<string | null>) => {
            state.currentFolderId = action.payload;
        },
        moveItem: (
            state,
            action: PayloadAction<{
                itemId: string;
                targetFolderId: string | null;
            }>,
        ) => {
            const { itemId, targetFolderId } = action.payload;
            const itemToMove = state.items.find((item) => item.id === itemId);
            if (itemToMove) {
                itemToMove.parentId = targetFolderId;
            }
        },
    },
});

export const {
    setActiveTab,
    setSearchTerm,
    setIsCreating,
    addFolder,
    setCurrentFolderId,
    moveItem,
} = materialsSlice.actions;

export default materialsSlice.reducer;
