import {
    combineReducers,
    configureStore,
    type UnknownAction,
} from "@reduxjs/toolkit";
import materialsReducer from "../features/materials/materialsSlice.tsx";
import authReducer, { logoutUser } from "../features/auth/authSlice.tsx";
import flashcardSetReducer from "../features/flashcardSets/flashcardSetSlice.tsx";
import sharesReducer from "../features/shares/sharesSlice.tsx";

// https://stackoverflow.com/questions/35622588/how-to-reset-the-state-of-a-redux-store

const appReducer = combineReducers({
    materials: materialsReducer,
    auth: authReducer,
    flashcardSet: flashcardSetReducer,
    shares: sharesReducer,
});

const rootReducer = (
    state: ReturnType<typeof appReducer> | undefined,
    action: UnknownAction,
) => {
    if (action.type === logoutUser.fulfilled.type) {
        const initialState = appReducer(undefined, action);
        return {
            ...initialState,
            auth: {
                ...initialState.auth,
                status: "failed",
            },
        };
    }
    return appReducer(state, action);
};

export const store = configureStore({
    // @ts-ignore
    reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export type AppStore = typeof store;
