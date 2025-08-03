import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";
import {
    checkAuthApi,
    loginUserApi,
    logoutUserApi,
    registerUserApi,
    setCsrfHeader,
    type UserCredentials,
} from "./authService";

interface User {
    email: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    csrfToken: string | null;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    csrfToken: null,
    error: null,
};

export const loginUser = createAsyncThunk(
    "auth/login",
    async (credentials: UserCredentials, { dispatch, rejectWithValue }) => {
        try {
            const data = await loginUserApi(credentials);
            dispatch(setCsrfToken(data.csrf_token));
            await dispatch(checkAuthStatus());
            return data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || "Login failed",
            );
        }
    },
);

export const registerUser = createAsyncThunk(
    "auth/register",
    async (credentials: UserCredentials, { dispatch, rejectWithValue }) => {
        try {
            const data = await registerUserApi(credentials);
            dispatch(setCsrfToken(data.csrf_token));
            await dispatch(checkAuthStatus());
            return data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || "Registration failed",
            );
        }
    },
);

export const checkAuthStatus = createAsyncThunk(
    "auth/checkStatus",
    async (_, { rejectWithValue }) => {
        try {
            const data = await checkAuthApi();
            return data;
        } catch (error: any) {
            return rejectWithValue("Not authenticated");
        }
    },
);

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            await logoutUserApi();
        } catch (error: any) {
            return rejectWithValue("Logout failed");
        }
    },
);

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCsrfToken: (state, action: PayloadAction<string>) => {
            state.csrfToken = action.payload;
            setCsrfHeader(action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.rejected, (state: AuthState, action) => {
                state.error = action.payload as string;
            })
            .addCase(
                checkAuthStatus.fulfilled,
                (state: AuthState, action: PayloadAction<User>) => {
                    state.isAuthenticated = true;
                    state.user = action.payload;
                    state.error = null;
                },
            )
            .addCase(checkAuthStatus.rejected, (state: AuthState) => {
                state.isAuthenticated = false;
                state.user = null;
            })
            .addCase(logoutUser.fulfilled, (state: AuthState) => {
                state.isAuthenticated = false;
                state.user = null;
                state.csrfToken = null;
                state.error = null;
            });
    },
});

export const { setCsrfToken } = authSlice.actions;
export default authSlice.reducer;
