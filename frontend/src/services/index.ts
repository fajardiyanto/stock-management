import { authService } from "./authService";
import { API_BASE_URL } from "../constants/constants";

export const apiCall = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (response.status === 401) {
        authService.logout();
        window.location.reload();
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API call failed");
    }

    return response.json();
};