import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../features/auth/authSlice";
import "./Auth.css";

const RegisterView = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { isAuthenticated, error } = useAppSelector((state) => state.auth);
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(registerUser({ email, password }));
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h1>Register</h1>
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
                        placeholder="Password"
                        required
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="auth-button">
                    Register
                </button>
                <p className="auth-link">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterView;
