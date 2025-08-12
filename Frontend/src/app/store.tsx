import { configureStore } from "@reduxjs/toolkit";
import materialsReducer from "../features/materials/materialsSlice.tsx";
import authReducer from "../features/auth/authSlice.tsx";
import flashcardSetsReducer from "../features/flashcardSets/flashcardSetsSlice.tsx";
import flashcardSetViewerReducer from "../features/flashcardSets/flashcardSetViewerSlice.tsx";

export const store = configureStore({
    reducer: {
        materials: materialsReducer,
        auth: authReducer,
        flashcardSets: flashcardSetsReducer,
        flashcardSetViewer: flashcardSetViewerReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
