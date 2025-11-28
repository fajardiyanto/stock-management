export type MenuId = "dashboard" | "sales" | "purchase" | "stock" | "users" | "fiber";

export interface ApiError {
    message: string;
}

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