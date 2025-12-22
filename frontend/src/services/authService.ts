import {
    CreateUserRequest,
    LoginRequest,
    LoginResponse,
    UpdateUserRequest,
    User,
    UserFilters,
    UserPaginatedData,
    ChangePasswordRequest,
    ChangePasswordResponse,
    ResetPasswordResponse,
} from "../types/user";
import { ApiResponse } from "../types";
import { API_BASE_URL } from "../constants/constants";
import { apiCall } from ".";

export const authService = {
    login: async (phone: string, password: string): Promise<LoginResponse> => {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password } as LoginRequest),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Login failed");
        }

        const data: LoginResponse = await response.json();
        localStorage.setItem("token", data.data?.token);
        localStorage.setItem("user", JSON.stringify(data.data?.user));
        localStorage.setItem("activeMenu", "analytics");
        return data;
    },

    logout: (): void => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("maxWidth");
        localStorage.removeItem("activeMenu");
    },

    getToken: (): string | null => {
        return localStorage.getItem("token");
    },

    getUser: (): User | null => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem("token");
    },

    getListUsers: async (
        filters: UserFilters = {}
    ): Promise<ApiResponse<UserPaginatedData>> => {
        const queryParams = new URLSearchParams();

        queryParams.append("page", String(filters.page || 1));
        queryParams.append("size", String(filters.size || 10));

        if (filters.phone) {
            queryParams.append("phone", filters.phone);
        }
        if (filters.name) {
            queryParams.append("name", filters.name);
        }

        const response = await apiCall<ApiResponse<UserPaginatedData>>(
            `/users?${queryParams.toString()}`
        );

        return response;
    },

    getUserById: async (uuid: string): Promise<ApiResponse<User>> => {
        const response = await apiCall<ApiResponse<User>>(`/users/${uuid}`);
        return response;
    },

    createUser: async (
        userData: CreateUserRequest
    ): Promise<ApiResponse<User>> => {
        const response = await apiCall<ApiResponse<User>>("/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });

        return response;
    },

    updateUser: async (
        uuid: string,
        userData: UpdateUserRequest
    ): Promise<ApiResponse<UpdateUserRequest>> => {
        const response = await apiCall<ApiResponse<UpdateUserRequest>>(
            `/users/${uuid}`,
            {
                method: "PUT",
                body: JSON.stringify(userData),
            }
        );

        return response;
    },

    deleteUser: async (uuid: string): Promise<ApiResponse<null>> => {
        const response = await apiCall<ApiResponse<null>>(`/users/${uuid}`, {
            method: "DELETE",
        });

        return response;
    },

    getListUserRoles: async (role: string): Promise<ApiResponse<User[]>> => {
        const response = await apiCall<ApiResponse<User[]>>(
            `/users/role/${role}`
        );
        return response;
    },

    changePassword: async (
        data: ChangePasswordRequest
    ): Promise<ApiResponse<ChangePasswordResponse>> => {
        const response = await apiCall<ApiResponse<ChangePasswordResponse>>(
            `/users/change-password`,
            {
                method: "PUT",
                body: JSON.stringify(data),
            }
        );
        return response;
    },

    resetPassword: async (
        userId: string
    ): Promise<ApiResponse<ResetPasswordResponse>> => {
        const response = await apiCall<ApiResponse<ResetPasswordResponse>>(
            `/users/${userId}/reset-password`,
            {
                method: "PUT",
            }
        );
        return response;
    },
};
