export type MenuId =
    | "dashboard"
    | "sales"
    | "purchase"
    | "stock"
    | "users"
    | "fiber"
    | "analytics"
    | "audit";

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

export const widthOptions = [
    { percent: "0%", label: "" },
    { percent: "10%", label: "max-w-xs" },
    { percent: "20%", label: "max-w-sm" },
    { percent: "30%", label: "max-w-md" },
    { percent: "40%", label: "max-w-lg" },
    { percent: "50%", label: "max-w-4xl" },
    { percent: "60%", label: "max-w-5xl" },
    { percent: "70%", label: "max-w-6xl" },
    { percent: "80%", label: "max-w-7xl" },
    { percent: "90%", label: "max-w-8xl" },
    { percent: "100%", label: "max-w-9xl" },
];
