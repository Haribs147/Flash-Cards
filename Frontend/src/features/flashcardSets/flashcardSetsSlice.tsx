import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";
import { createNewSetApi, updateSetApi } from "./flashcardSetsService";
import type { MaterialItem } from "../materials/materialsSlice";

export interface Flashcard {
    id: number | null;
    front_content: string;
    back_content: string;
}

export interface FlashcardSetsState {
    id: number | null;
    name: string;
    description: string;
    is_public: boolean;
    flashcards: Flashcard[];
    status: "idle" | "loading" | "saving" | "failed" | "succeded";
    error: string | null;
}

const initialState: FlashcardSetsState = {
    id: null,
    name: "Nowy zestaw",
    description: "",
    is_public: false,
    flashcards: [],
    status: "idle",
    error: null,
};

export const createNewSet = createAsyncThunk(
    "flashcardSets/createSet",
    async (
        setData: { name: string; parent_id: number | null },
        { rejectWithValue },
    ) => {
        try {
            return await createNewSetApi(setData);
        } catch (error: any) {
            return rejectWithValue("Failed to create new set");
        }
    },
);

export const updateSet = createAsyncThunk(
    "flashcardSets/updateSet",
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as { flashcardSets: FlashcardSetsState };
        const { id, name, description, is_public, flashcards } =
            state.flashcardSets;
        if (!id) {
            return rejectWithValue(
                "This set ID cannot be update, because it doesn't exist",
            );
        }
        try {
            const updateData = {
                name: name,
                description: description,
                is_public: is_public,
                flashcards: flashcards,
            };
            return await updateSetApi(id, updateData);
        } catch (error: any) {
            return rejectWithValue("Failed to update the set");
        }
    },
);

export const flashcardSetsSlice = createSlice({
    name: "flashcardSets",
    initialState,
    reducers: {
        setName: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },
        setDescription: (state, action: PayloadAction<string>) => {
            state.description = action.payload;
        },
        setIsPublic: (state, action: PayloadAction<boolean>) => {
            state.is_public = action.payload;
        },
        addLocalFlashcard: (state) => {
            state.flashcards.push({
                id: null,
                front_content: "<div></div>",
                back_content: "<div></div>",
            });
        },
        updateFlashcardContent: (
            state,
            action: PayloadAction<{
                index: number;
                side: "front" | "back";
                content: string;
            }>,
        ) => {
            const { index, side, content } = action.payload;
            if (state.flashcards[index]) {
                if (side === "front") {
                    state.flashcards[index].front_content = content;
                } else {
                    state.flashcards[index].back_content = content;
                }
            }
        },
        resetFlashcardSets: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(createNewSet.pending, (state) => {
                state.status = "loading";
            })
            .addCase(
                createNewSet.fulfilled,
                (state, action: PayloadAction<MaterialItem>) => {
                    state.name = action.payload.name;
                    state.status = "idle";
                    state.id = action.payload.id;
                    state.flashcards = [
                        {
                            id: null,
                            front_content: "<div></div>",
                            back_content: "<div></div>",
                        },
                    ];
                },
            )
            .addCase(createNewSet.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            })
            .addCase(updateSet.pending, (state) => {
                state.status = "saving";
            })
            .addCase(updateSet.fulfilled, (state) => {
                state.status = "succeded";
            })
            .addCase(updateSet.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            });
    },
});

export const {
    setName,
    setDescription,
    setIsPublic,
    addLocalFlashcard,
    updateFlashcardContent,
    resetFlashcardSets,
} = flashcardSetsSlice.actions;

export default flashcardSetsSlice.reducer;
