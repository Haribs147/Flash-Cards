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
    type LoginCredentials,
    type RegisterCredentials,
} from "./authService";

interface User {
    email: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    csrfToken: string | null;
    error: string | null;
    status: "idle" | "loading" | "succeded" | "failed";
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    csrfToken: null,
    error: null,
    status: "idle",
};

export const loginUser = createAsyncThunk(
    "auth/login",
    async (credentials: LoginCredentials, { dispatch, rejectWithValue }) => {
        try {
            const data = await loginUserApi(credentials);
            dispatch(setCsrfToken(data.csrf_token));
            return data.user;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail || "Login failed",
            );
        }
    },
);

export const registerUser = createAsyncThunk(
    "auth/register",
    async (credentials: RegisterCredentials, { dispatch, rejectWithValue }) => {
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
        clearAuthError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(
                loginUser.fulfilled,
                (state: AuthState, action: PayloadAction<User>) => {
                    state.isAuthenticated = true;
                    state.user = action.payload;
                    state.error = null;
                },
            )
            .addCase(loginUser.rejected, (state: AuthState, action) => {
                state.error = action.payload as string;
            })
            .addCase(registerUser.rejected, (state: AuthState, action) => {
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload as string;
            })
            .addCase(
                checkAuthStatus.fulfilled,
                (
                    state: AuthState,
                    action: PayloadAction<{ user: User; csrf_token: string }>,
                ) => {
                    state.isAuthenticated = true;
                    state.user = action.payload.user;

                    state.error = null;
                    state.status = "succeded";

                    state.csrfToken = action.payload.csrf_token;
                    setCsrfHeader(action.payload.csrf_token);
                },
            )
            .addCase(checkAuthStatus.pending, (state: AuthState) => {
                state.status = "loading";
            })
            .addCase(checkAuthStatus.rejected, (state: AuthState) => {
                state.isAuthenticated = false;
                state.user = null;
                state.status = "failed";
            })
            .addCase(logoutUser.fulfilled, (state: AuthState) => {
                state.isAuthenticated = false;
                state.user = null;
                state.csrfToken = null;
                state.error = null;
            });
    },
});

export const { setCsrfToken, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
