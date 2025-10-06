import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";
import {
    addCommentApi,
    copySetApi,
    createNewSetApi,
    deleteCommentApi,
    getSetApi,
    removeShareApi,
    shareSetApi,
    updateCommentApi,
    updateSetApi,
    updateSharesApi,
    voteOnCommentApi,
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

export interface Comment {
    id: number;
    text: string;
    author_email: string;
    created_at: string;
    upvotes: number;
    downvotes: number;
    user_vote: "upvote" | "downvote" | null;
    parent_id: number | null;
    replies: number[];
}

export interface CommentsData {
    comments: { [id: number]: Comment };
    top_level_comment_ids: number[];
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
    comments_data: CommentsData;
}

export interface FlashcardSetState {
    data: null | FlashcardSetData;
    status: "idle" | "loading" | "saving" | "failed" | "succeded";
    error: {
        message: string | null;
        statusCode: number | null;
    } | null;
}

const initialState: FlashcardSetState = {
    data: null,
    status: "idle",
    error: null,
};

const handleApiError = (error: any, defaultMessage: string) => {
    return {
        message: error.response?.data?.detail || defaultMessage,
        statusCode: error.response?.status || 500,
    };
};

export const getSet = createAsyncThunk(
    "flashcardSet/getSet",
    async (set_id: number, { rejectWithValue }) => {
        try {
            const data = await getSetApi(set_id);
            return data;
        } catch (error: any) {
            return rejectWithValue(
                handleApiError(error, "Failed to get the set"),
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
            return rejectWithValue({
                message: "No set data to save",
                statusCode: 400,
            });
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
                handleApiError(error, "Failed to save the set"),
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
                handleApiError(error, "Failed to add the share"),
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
                handleApiError(error, "Failed to remove the share"),
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
                handleApiError(error, "Failed to update the shares"),
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
            return rejectWithValue(handleApiError(error, "Failed to vote"));
        }
    },
);

export const addComment = createAsyncThunk(
    "flashcardSet/addComment",
    async (
        {
            materialId,
            text,
            parentCommentId,
        }: {
            materialId: number;
            text: string;
            parentCommentId?: number | null;
        },
        { rejectWithValue },
    ) => {
        try {
            const newComment = await addCommentApi(
                materialId,
                text,
                parentCommentId,
            );
            return newComment;
        } catch (error: any) {
            return rejectWithValue(
                handleApiError(error, "Failed to add a new comment"),
            );
        }
    },
);

export const deleteComment = createAsyncThunk(
    "flashcardSet/deleteComment",
    async (commentId: number, { rejectWithValue }) => {
        try {
            await deleteCommentApi(commentId);
            return commentId;
        } catch (error: any) {
            return rejectWithValue(
                handleApiError(error, "Failed to delete a comment"),
            );
        }
    },
);

export const updateComment = createAsyncThunk(
    "flashcardSet/updateComment",
    async (
        {
            commentId,
            text,
        }: {
            commentId: number;
            text: string;
        },
        { rejectWithValue },
    ) => {
        try {
            const updatedComment = await updateCommentApi(commentId, text);
            return updatedComment;
        } catch (error: any) {
            return rejectWithValue(
                handleApiError(error, "Failed to update a comment"),
            );
        }
    },
);

export const voteOnComment = createAsyncThunk(
    "flashcardSet/voteOnComment",
    async (
        {
            commentId,
            vote_type,
        }: { commentId: number; vote_type: "upvote" | "downvote" },
        { rejectWithValue },
    ) => {
        try {
            const data = await voteOnCommentApi(commentId, vote_type);
            return { commentId, data };
        } catch (error: any) {
            return rejectWithValue(handleApiError(error, "Failed to vote"));
        }
    },
);

export const copySet = createAsyncThunk(
    "flashcardSet/copySet",
    async (
        {
            setId,
            targetFolderId,
        }: { setId: number; targetFolderId: number | null },
        { rejectWithValue },
    ) => {
        try {
            const newMaterial = await copySetApi(setId, targetFolderId);
            return newMaterial;
        } catch (error: any) {
            return rejectWithValue(
                handleApiError(error, "Failed to copy the set"),
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
                comments_data: {
                    comments: {},
                    top_level_comment_ids: [],
                },
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
        const handleRejected = (state: FlashcardSetState, action: any) => {
            state.status = "failed";
            state.error = action.payload as {
                message: string;
                statusCode: number;
            };
        };

        builder
            .addCase(getSet.pending, (state) => {
                state.status = "loading";
            })
            .addCase(getSet.fulfilled, (state, action) => {
                state.status = "succeded";
                state.data = action.payload;
            })
            .addCase(getSet.rejected, handleRejected)
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
            .addCase(saveSet.rejected, handleRejected)
            .addCase(shareSet.fulfilled, (state, action) => {
                state.data?.shared_with.push(action.payload);
            })
            .addCase(shareSet.rejected, handleRejected)
            .addCase(removeShare.fulfilled, (state, action) => {
                if (state.data) {
                    state.data.shared_with = state.data.shared_with.filter(
                        (u) => u.user_id != action.payload,
                    );
                }
            })
            .addCase(removeShare.rejected, handleRejected)
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
            .addCase(savePermissionChanges.rejected, handleRejected)
            .addCase(voteOnMaterial.fulfilled, (state, action) => {
                if (state.data) {
                    state.data.upvotes = action.payload.upvotes;
                    state.data.downvotes = action.payload.downvotes;
                    state.data.user_vote = action.payload.user_vote;
                }
            })
            .addCase(voteOnMaterial.rejected, handleRejected)
            .addCase(addComment.fulfilled, (state, action) => {
                const newComment = action.payload;
                if (!state.data || !state.data.comments_data) {
                    return;
                }

                state.data.comments_data.comments[newComment.id] = newComment;

                if (newComment.parent_id) {
                    const parent =
                        state.data.comments_data.comments[newComment.parent_id];
                    if (parent) {
                        parent.replies.unshift(newComment.id);
                    }
                } else {
                    state.data.comments_data.top_level_comment_ids.unshift(
                        newComment.id,
                    );
                }
            })
            .addCase(addComment.rejected, handleRejected)
            .addCase(updateComment.fulfilled, (state, action) => {
                const updatedComment = action.payload;
                if (!state.data || !state.data.comments_data) {
                    return;
                }
                state.data.comments_data.comments[updatedComment.id] = {
                    ...state.data.comments_data.comments[updatedComment.id],
                    ...updatedComment,
                };
            })
            .addCase(updateComment.rejected, handleRejected)
            .addCase(deleteComment.fulfilled, (state, action) => {
                const commentIdToDelete = action.payload;
                if (!state.data || !state.data.comments_data) {
                    return;
                }

                const comments_data = state.data.comments_data;
                const commentToDelete =
                    comments_data.comments[commentIdToDelete];
                if (!commentToDelete) {
                    return;
                }

                const deleteChildren = (id: number) => {
                    const comment = comments_data.comments[id];
                    if (!comment) {
                        return;
                    }
                    comment.replies.forEach((replyId) =>
                        deleteChildren(replyId),
                    );
                    delete comments_data.comments[id];
                };

                // Remove from parents replies array orfrom top level id comments
                if (commentToDelete.parent_id) {
                    const parent =
                        comments_data.comments[commentToDelete.parent_id];
                    if (parent) {
                        parent.replies = parent.replies.filter(
                            (id) => id !== commentIdToDelete,
                        );
                    }
                } else {
                    comments_data.top_level_comment_ids =
                        comments_data.top_level_comment_ids.filter(
                            (id) => id !== commentIdToDelete,
                        );
                }
                deleteChildren(commentIdToDelete);
            })
            .addCase(deleteComment.rejected, handleRejected)
            .addCase(voteOnComment.fulfilled, (state, action) => {
                if (!state.data || !state.data.comments_data) {
                    return;
                }
                const { commentId, data } = action.payload;
                const comment = state.data.comments_data.comments[commentId];
                if (comment) {
                    comment.upvotes = data.upvotes;
                    comment.downvotes = data.downvotes;
                    comment.user_vote = data.user_vote;
                }
            })
            .addCase(voteOnComment.rejected, handleRejected);
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
