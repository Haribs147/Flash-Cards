import { useEffect, useState, type JSX } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import MaterialsView from "./components/Materials/MaterialsView";
import NewSetView from "./components/NewSet/NewSetView";
import FlashcardSetView from "./components/FlashcardSet/FlashcardSetView";
import KnowledgeCheckView from "./components/FlashcardSet/KnowledgeCheckView";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import LoginView from "./components/Auth/LoginView";
import RegisterView from "./components/Auth/RegisterView";
import { checkAuthStatus } from "./features/auth/authSlice";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppChildren = () => {
    return (
        <>
            <Navbar />
            <Sidebar activeItem={"home"} onItemClick={() => {}} />

            <main className="main-content">
                <Routes>
                    <Route path="/" element={<MaterialsView />} />
                    <Route path="/new-set" element={<NewSetView />} />
                    <Route path="/set/:setId" element={<FlashcardSetView />} />
                    <Route
                        path="/set/:setId/check"
                        element={<KnowledgeCheckView />}
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </>
    );
};

function App() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(checkAuthStatus());
    }, [dispatch]);

    return (
        <div className="App">
            <Routes>
                <Route path="/login" element={<LoginView />} />
                <Route path="/register" element={<RegisterView />} />
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <AppChildren />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
}

export default App;
