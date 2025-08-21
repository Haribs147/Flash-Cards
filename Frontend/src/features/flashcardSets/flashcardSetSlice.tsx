import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";
import {
    createNewSetApi,
    getSetApi,
    updateSetApi,
} from "./flashcardSetService";

export interface Flashcard {
    id: number | null;
    front_content: string;
    back_content: string;
}

export interface FlashcardSetData {
    id: number | null;
    name: string;
    description: string;
    is_public: boolean;
    creator: string;
    flashcards: Flashcard[];
}

export interface FlashcardSetState {
    data: null | FlashcardSetData;
    status: "idle" | "loading" | "saving" | "failed" | "succeded";
    error: string | null;
}

const initialState: FlashcardSetState = {
    data: null,
    status: "idle",
    error: null,
};

export const getSet = createAsyncThunk(
    "flashcardSet/getSet",
    async (set_id: number, { rejectWithValue }) => {
        try {
            const data = await getSetApi(set_id);
            return data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || "Failed to get the set",
            );
        }
    },
);

export const saveSet = createAsyncThunk(
    "flashcardSet/updateSet",
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as { flashcardSet: FlashcardSetState };
        const setData = state.flashcardSet.data;

        if (!setData) {
            return rejectWithValue("No set data to save");
        }

        const { id, ...updateData } = setData;

        try {
            if (id) {
                return updateSetApi(id, updateData);
            } else {
                const { creator, ...createData } = updateData;
                const { currentFolderId } = (getState() as any).materials;
                return await createNewSetApi({
                    ...createData,
                    parent_id: currentFolderId,
                });
            }
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || "Failed to save the set",
            );
        }
    },
);

export const flashcardSetSlice = createSlice({
    name: "flashcardSet",
    initialState,
    reducers: {
        initializeNewSet: (state) => {
            state.status = "idle";
            state.error = null;
            state.data = {
                id: null,
                name: "Nowy zestaw",
                description: "",
                is_public: false,
                creator: "",
                flashcards: [
                    {
                        id: null,
                        front_content: "<div></div>",
                        back_content: "<div></div>",
                    },
                ],
            };
        },
        setName: (state, action: PayloadAction<string>) => {
            if (state.data) {
                state.data.name = action.payload;
            }
        },
        setDescription: (state, action: PayloadAction<string>) => {
            if (state.data) {
                state.data.description = action.payload;
            }
        },
        setIsPublic: (state, action: PayloadAction<boolean>) => {
            if (state.data) {
                state.data.is_public = action.payload;
            }
        },
        addLocalFlashcard: (state) => {
            if (state.data) {
                state.data.flashcards.push({
                    id: null,
                    front_content: "<div></div>",
                    back_content: "<div></div>",
                });
            }
        },
        updateFlashcardContent: (
            state,
            action: PayloadAction<{
                index: number;
                side: "front" | "back";
                content: string;
            }>,
        ) => {
            if (state.data) {
                const { index, side, content } = action.payload;
                if (side === "front") {
                    state.data.flashcards[index].front_content = content;
                } else {
                    state.data.flashcards[index].back_content = content;
                }
            }
        },
        resetFlashcardSet: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSet.pending, (state) => {
                state.status = "loading";
            })
            .addCase(getSet.fulfilled, (state, action) => {
                state.status = "succeded";
                state.data = action.payload;
            })
            .addCase(getSet.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            })
            .addCase(saveSet.pending, (state) => {
                state.status = "saving";
            })
            .addCase(saveSet.fulfilled, (state, action) => {
                state.status = "succeded";
                if (state.data) {
                    state.data.id = action.payload.id;
                    state.data.name = action.payload.name;
                }
            })
            .addCase(saveSet.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            });
    },
});

export const {
    initializeNewSet,
    setName,
    setDescription,
    setIsPublic,
    addLocalFlashcard,
    updateFlashcardContent,
    resetFlashcardSet,
} = flashcardSetSlice.actions;

export default flashcardSetSlice.reducer;
