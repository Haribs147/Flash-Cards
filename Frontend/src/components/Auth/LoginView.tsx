import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useNavigate } from "react-router-dom";

export default function LoginView() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { isAuthenticated, status, error } = useAppSelector(
        (state) => state.auth,
    );
    return <div>LoginView</div>;
}
