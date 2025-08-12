import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";
import { getSetApi } from "./flashcardSetsService";
import type { Flashcard } from "./flashcardSetsSlice";

interface FlashcardSetView {
    name: string;
    description: string;
    creator: string;
    flashcards: Flashcard[];
}

interface FlashcardSetViewerState {
    set: FlashcardSetView | null;
    status: "idle" | "loading" | "failed" | "succeded";
    error: string | null;
}

const initialState: FlashcardSetViewerState = {
    set: null,
    status: "idle",
    error: null,
};

export const getSet = createAsyncThunk(
    "flashcardSets/getSet",
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

export const flashcardSetViewerSlice = createSlice({
    name: "FlashcardSetViewer",
    initialState,
    reducers: {
        clearSet: (state) => {
            state.set = null;
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSet.pending, (state) => {
                state.status = "loading";
                state.set = null;
            })
            .addCase(
                getSet.fulfilled,
                (state, action: PayloadAction<FlashcardSetView>) => {
                    state.status = "succeded";
                    state.set = action.payload;
                },
            )
            .addCase(getSet.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            });
    },
});

export const { clearSet } = flashcardSetViewerSlice.actions;
export default flashcardSetViewerSlice.reducer;
