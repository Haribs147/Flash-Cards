import { configureStore } from "@reduxjs/toolkit";
import materialsReducer from "../features/materials/materialsSlice.tsx";
import authReducer from "../features/auth/authSlice.tsx";
import flashcardSetReducer from "../features/flashcardSets/flashcardSetSlice.tsx";
import sharesReducer from "../features/shares/sharesSlice.tsx";

export const store = configureStore({
    reducer: {
        materials: materialsReducer,
        auth: authReducer,
        flashcardSet: flashcardSetReducer,
        shares: sharesReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
