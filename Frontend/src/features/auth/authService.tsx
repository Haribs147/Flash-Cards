import axios from "axios";

export interface UserCredentials {
    email: string;
    password: string;
}

const API_URL = "http://localhost:8000";

axios.defaults.withCredentials = true;

export const loginUserApi = async (credentials: UserCredentials) => {
    const params = new URLSearchParams();
    params.append("username", credentials.email);
    params.append("password", credentials.password);

    const respone = await axios.post(`${API_URL}/login`, params);
    return respone.data;
};

export const registerUserApi = async (credentails: UserCredentials) => {
    const response = await axios.post(`${API_URL}/register`, {
        email: credentails.email,
        password: credentails.password,
    });
    return response.data;
};

export const checkAuthApi = async () => {
    const response = await axios.get(`${API_URL}/users/me`);
    return response.data;
};

export const logoutUserApi = async () => {
    const response = await axios.post(`${API_URL}/logout`);
    return response.data;
};

export const setCsrfHeader = (token: string) => {
    axios.defaults.headers.common["X-CSRF-TOKEN"] = token;
};
