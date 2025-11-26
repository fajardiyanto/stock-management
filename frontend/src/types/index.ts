export interface User {
    id: number;
    uuid: string;
    name: string;
    phone: string;
    role: string;
    status: boolean;
    address: string;
    shipping_address: string;
    balance: number;
    created_at: string;
    updated_at: string;
}

export interface LoginRequest {
    phone: string;
    password: string;
}

export interface LoginResponse {
    status_code: number;
    message: string;
    data: {
        token: string;
        user: User;
    };
}

export interface ApiError {
    message: string;
}

export type MenuId = "dashboard" | "sales" | "purchase" | "stock" | "users";

export interface MenuItem {
    id: MenuId;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
}

export interface ApiResponse<T> {
    status_code: number;
    message: string;
    data: T;
}

export interface UserPaginatedData {
    size: number;
    page_no: number;
    data: User[];
    total: number;
}

export interface UserFilters {
    page?: number;
    size?: number;
    phone?: string;
    name?: string;
}

export interface UpdateUserRequest {
    name: string;
    phone: string;
    role: string;
    address: string;
    shipping_address: string;
    password?: string;
}

export interface CreateUserRequest {
    name: string;
    phone: string;
    role: string;
    address: string;
    shipping_address: string;
    password: string;
}