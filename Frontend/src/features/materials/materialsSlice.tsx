import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";
import {
    createNewFolderApi,
    fetchAllMaterialsApi,
    moveItemApi,
} from "./materialsService";

// Define a type for a single item
export interface MaterialItem {
    id: number;
    item_type: "folder" | "set";
    name: string;
    parent_id: number | null;
}

// Define a type for the slice state
interface MaterialsState {
    items: MaterialItem[];
    activeTab: string;
    searchTerm: string;
    isCreatingFolder: boolean;
    currentFolderId: number | null;
    status: "idle" | "loading" | "succeded" | "failed";
    error: string | null;
}

// Define the initial state using that type
const initialState: MaterialsState = {
    items: [],
    activeTab: "Foldery",
    searchTerm: "",
    isCreatingFolder: false,
    currentFolderId: null,
    status: "idle",
    error: null,
};

export const fetchAllMaterials = createAsyncThunk(
    "materials/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            return await fetchAllMaterialsApi();
        } catch (error: any) {
            return rejectWithValue("Failed to get materials");
        }
    },
);

export const createFolder = createAsyncThunk(
    "folders/createFolder",
    async (
        folderData: { name: string; parent_id: number | null },
        { rejectWithValue },
    ) => {
        try {
            return await createNewFolderApi(folderData);
        } catch (error: any) {
            return rejectWithValue("Failed to create new folder");
        }
    },
);

export const moveItem = createAsyncThunk(
    "materials/moveItem",
    async (
        data: { itemId: number; targetFolderId: number | null },
        { rejectWithValue },
    ) => {
        try {
            return await moveItemApi(data);
        } catch (error: any) {
            return rejectWithValue("Failed to move item");
        }
    },
);

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
        setCurrentFolderId: (state, action: PayloadAction<number | null>) => {
            state.currentFolderId = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllMaterials.pending, (state) => {
                state.status = "loading";
            })
            .addCase(
                fetchAllMaterials.fulfilled,
                (state, action: PayloadAction<MaterialItem[]>) => {
                    state.status = "succeded";
                    state.items = action.payload;
                },
            )
            .addCase(fetchAllMaterials.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            })
            .addCase(
                createFolder.fulfilled,
                (state, action: PayloadAction<MaterialItem>) => {
                    state.items.unshift(action.payload);
                    state.isCreatingFolder = false;
                },
            )
            .addCase(
                moveItem.fulfilled,
                (state, action: PayloadAction<MaterialItem>) => {
                    const updatedItem = action.payload;
                    const index = state.items.findIndex(
                        (item) => item.id === updatedItem.id,
                    );
                    if (index !== -1) {
                        state.items[index] = updatedItem;
                    }
                },
            );
    },
});

export const {
    setActiveTab,
    setSearchTerm,
    setIsCreating,
    setCurrentFolderId,
} = materialsSlice.actions;

export default materialsSlice.reducer;
