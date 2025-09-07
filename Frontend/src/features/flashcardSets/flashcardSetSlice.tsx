import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";
import {
    createNewSetApi,
    getSetApi,
    removeShareApi,
    shareSetApi,
    updateSetApi,
    updateSharesApi,
    voteOnMaterialApi,
} from "./flashcardSetService";

export interface Flashcard {
    id: number | null;
    front_content: string;
    back_content: string;
}

export interface SharedUser {
    user_id: number;
    email: string;
    permission: "viewer" | "editor";
}

export interface FlashcardSetData {
    id: number | null;
    name: string;
    description: string;
    is_public: boolean;
    creator: string;
    flashcards: Flashcard[];
    shared_with: SharedUser[];
    upvotes: number;
    downvotes: number;
    user_vote: "upvote" | "downvote" | null;
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

export const shareSet = createAsyncThunk(
    "flashcardSet/shareSet",
    async (
        { setId, email }: { setId: number; email: string },
        { rejectWithValue },
    ) => {
        try {
            return await shareSetApi(setId, email);
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || "Failed to add the share",
            );
        }
    },
);

export const removeShare = createAsyncThunk(
    "flashcardSet/removeShare",
    async (
        { setId, userId }: { setId: number; userId: number },
        { rejectWithValue },
    ) => {
        try {
            await removeShareApi(setId, userId);
            return userId;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || "Failed to remove the share",
            );
        }
    },
);

export const savePermissionChanges = createAsyncThunk(
    "flashcardSet/UpdateShares",
    async (
        {
            setId,
            updates,
        }: {
            setId: number;
            updates: { user_id: number; permission: string }[];
        },
        { rejectWithValue },
    ) => {
        try {
            await updateSharesApi(setId, updates);
            return updates;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || "Failed to update the shares",
            );
        }
    },
);

export const voteOnMaterial = createAsyncThunk(
    "flashcardSet/voteOnMaterial",
    async (
        {
            materialId,
            vote_type,
        }: { materialId: number; vote_type: "upvote" | "downvote" },
        { rejectWithValue },
    ) => {
        try {
            const data = await voteOnMaterialApi(materialId, vote_type);
            return data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || "Failed to vote",
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
                shared_with: [],
                upvotes: 0,
                downvotes: 0,
                user_vote: null,
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
            })
            .addCase(shareSet.fulfilled, (state, action) => {
                state.data?.shared_with.push(action.payload);
            })
            .addCase(removeShare.fulfilled, (state, action) => {
                if (state.data) {
                    state.data.shared_with = state.data.shared_with.filter(
                        (u) => u.user_id != action.payload,
                    );
                }
            })
            .addCase(savePermissionChanges.fulfilled, (state, action) => {
                if (state.data) {
                    const updatesMap = new Map(
                        action.payload.map((u) => [u.user_id, u.permission]),
                    );
                    state.data.shared_with.forEach((user) => {
                        if (updatesMap.has(user.user_id)) {
                            user.permission = updatesMap.get(user.user_id) as
                                | "viewer"
                                | "editor";
                        }
                    });
                }
            })
            .addCase(voteOnMaterial.fulfilled, (state, action) => {
                if (state.data) {
                    state.data.upvotes = action.payload.upvotes;
                    state.data.downvotes = action.payload.downvotes;
                    state.data.user_vote = action.payload.user_vote;
                }
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
