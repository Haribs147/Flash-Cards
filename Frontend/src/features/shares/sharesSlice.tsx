import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    acceptShareApi,
    fetchPendingSharesApi,
    rejectShareApi,
    type PendingShare,
} from "./sharesService";

interface SharesState {
    pending: PendingShare[];
    status: "idle" | "loading" | "succeded" | "failed";
    error: string | null;
}

const initialState: SharesState = {
    pending: [],
    status: "idle",
    error: null,
};

export const fetchPendingShares = createAsyncThunk(
    "shares/fetchPending",
    async (_, { rejectWithValue }) => {
        try {
            return await fetchPendingSharesApi();
        } catch (error: any) {
            return rejectWithValue("Failed to get pending shares");
        }
    },
);

export const acceptShare = createAsyncThunk(
    "shares/accept",
    async (share_id: number, { rejectWithValue }) => {
        try {
            return await acceptShareApi(share_id);
        } catch (error: any) {
            return rejectWithValue("Failed to accept share");
        }
    },
);

export const rejectShare = createAsyncThunk(
    "shares/reject",
    async (share_id: number, { rejectWithValue }) => {
        try {
            await rejectShareApi(share_id);
            return share_id;
        } catch (error: any) {
            return rejectWithValue("Failed to reject share");
        }
    },
);

export const sharesSlice = createSlice({
    name: "shares",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPendingShares.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchPendingShares.fulfilled, (state, action) => {
                state.status = "succeded";
                state.pending = action.payload;
            })
            .addCase(fetchPendingShares.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            })
            .addCase(acceptShare.fulfilled, (state, action) => {
                state.pending = state.pending.filter(
                    (share) => share.share_id !== action.meta.arg,
                );
            })
            .addCase(rejectShare.fulfilled, (state, action) => {
                state.pending = state.pending.filter(
                    (share) => share.share_id !== action.payload,
                );
            });
    },
});

export default sharesSlice.reducer;
