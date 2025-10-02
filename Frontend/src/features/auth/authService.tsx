import axios from "axios";
import type { AppStore } from "../../app/store";
import { logoutUser, setCsrfToken } from "./authSlice";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    repeatPassword: string;
}

const API_URL = "http://localhost:8000";

axios.defaults.withCredentials = true;

export const loginUserApi = async (credentials: LoginCredentials) => {
    const params = new URLSearchParams();
    params.append("username", credentials.email);
    params.append("password", credentials.password);

    const respone = await axios.post(`${API_URL}/login`, params);
    return respone.data;
};

export const registerUserApi = async (credentails: RegisterCredentials) => {
    const response = await axios.post(`${API_URL}/register`, {
        email: credentails.email,
        password: credentails.password,
        repeatPassword: credentails.repeatPassword,
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

export const refreshTokenApi = async () => {
    const response = await axios.post(`${API_URL}/refresh`);
    return response.data;
};

export const setCsrfHeader = (token: string) => {
    axios.defaults.headers.common["X-CSRF-TOKEN"] = token;
};

// https://medium.com/@velja/token-refresh-with-axios-interceptors-for-a-seamless-authentication-experience-854b06064bde
export const setupAxiosInterceptor = (store: AppStore) => {
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            const isRefreshRequest = originalRequest.url.endsWith("/refresh");
            const isLoginRequest = originalRequest.url.endsWith("/login");
            const isRegisterRequest = originalRequest.url.endsWith("/register");
            const isLogoutRequest = originalRequest.url.endsWith("/logout");
            if (
                error.response.status === 401 &&
                !originalRequest._retry &&
                !isRefreshRequest &&
                !isLoginRequest &&
                !isRegisterRequest &&
                !isLogoutRequest
            ) {
                originalRequest._retry = true;
                try {
                    const { csrf_token } = await refreshTokenApi();

                    store.dispatch(setCsrfToken(csrf_token));
                    originalRequest.headers["X-CSRF-TOKEN"] = csrf_token;
                    return axios(originalRequest);
                } catch (refreshError) {
                    store.dispatch(logoutUser());
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        },
    );
};
