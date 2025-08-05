import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthError, registerUser } from "../../features/auth/authSlice";
import "./Auth.css";

const RegisterView = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { isAuthenticated, error } = useAppSelector((state) => state.auth);

    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(registerUser({ email, password, repeatPassword }));
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h1>Rejstracja</h1>
                <div className="input-group">
                    <input
                        type="email"
                        id="email"
                        className="auth-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                </div>
                <div className="input-group">
                    <input
                        type="password"
                        id="password"
                        className="auth-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Hasło"
                        required
                    />
                </div>
                <div className="input-group">
                    <input
                        type="password"
                        id="password"
                        className="auth-input"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        placeholder="Powtórz hasło"
                        required
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="auth-button">
                    Zarejstruj się
                </button>
                <p className="auth-link">
                    Posiadasz już konto?{" "}
                    <Link to="/login">Zaloguj się tutaj</Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterView;
