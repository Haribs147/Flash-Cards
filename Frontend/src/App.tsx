import { useEffect, type JSX } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import MaterialsView from "./components/Materials/MaterialsView";
import NewSetView from "./components/NewSet/NewSetView";
import FlashcardSetView from "./components/FlashcardSet/FlashcardSetView";
import KnowledgeCheckView from "./components/FlashcardSet/KnowledgeCheckView";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import LoginView from "./components/Auth/LoginView";
import RegisterView from "./components/Auth/RegisterView";
import { checkAuthStatus } from "./features/auth/authSlice";
import PublicPage from "./components/PublicPage/PublicPage";
import Layout from "./components/Layouts/Layout";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppChildren = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<MaterialsView />} />
                <Route path="/new-set" element={<NewSetView />} />
                <Route path="/set/edit/:setId" element={<NewSetView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
};

function App() {
    const dispatch = useAppDispatch();
    const authStatus = useAppSelector((state) => state.auth.status);

    useEffect(() => {
        if (authStatus == "idle") {
            dispatch(checkAuthStatus());
        }
    }, [authStatus, dispatch]);

    if (authStatus == "loading" || authStatus == "idle") {
        return <div className="App"></div>;
    }

    return (
        <div className="App">
            <Routes>
                <Route
                    path="/"
                    element={
                        <Layout>
                            <PublicPage />
                        </Layout>
                    }
                />
                <Route path="/login" element={<LoginView />} />
                <Route path="/register" element={<RegisterView />} />

                <Route
                    path="/set/:setId"
                    element={
                        <Layout>
                            <FlashcardSetView />
                        </Layout>
                    }
                />
                <Route
                    path="/set/:setId/check"
                    element={
                        <Layout>
                            <KnowledgeCheckView />
                        </Layout>
                    }
                />
                <Route
                    path="app/*"
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
