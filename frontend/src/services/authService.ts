import { ApiResponse, CreateUserRequest, LoginRequest, LoginResponse, UpdateUserRequest, User, UserFilters, UserPaginatedData } from "../types";
import { API_BASE_URL } from "../constants/constants";

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
        return data;
    },

    logout: (): void => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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

    getListUsers: async (filters: UserFilters = {}): Promise<ApiResponse<UserPaginatedData>> => {
        const queryParams = new URLSearchParams();

        queryParams.append('page', String(filters.page || 1));
        queryParams.append('size', String(filters.size || 10));

        if (filters.phone) {
            queryParams.append('phone', filters.phone);
        }
        if (filters.name) {
            queryParams.append('name', filters.name);
        }

        const response = await apiCall<ApiResponse<UserPaginatedData>>(
            `/users?${queryParams.toString()}`
        );

        return response;
    },

    getUserById: async (uuid: string): Promise<ApiResponse<User>> => {
        const response = await apiCall<ApiResponse<User>>(`/user/${uuid}`);
        return response;
    },

    createUser: async (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
        const response = await apiCall<ApiResponse<User>>('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        return response;
    },

    updateUser: async (uuid: string, userData: UpdateUserRequest): Promise<ApiResponse<UpdateUserRequest>> => {
        const response = await apiCall<ApiResponse<UpdateUserRequest>>(`/user/${uuid}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });

        return response;
    },

    deleteUser: async (uuid: string): Promise<ApiResponse<null>> => {
        const response = await apiCall<ApiResponse<null>>(`/user/${uuid}`, {
            method: 'DELETE'
        });

        return response;
    },

    getListUserRoles: async (role: string): Promise<ApiResponse<User[]>> => {
        const response = await apiCall<ApiResponse<User[]>>(`/user/role/${role}`);
        return response;
    }
};

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
