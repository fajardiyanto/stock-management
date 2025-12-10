import { MenuId } from "../types";
export const getDefaultActiveMenu = () => {
    const saved = localStorage.getItem("activeMenu");
    const validMenus: MenuId[] = [
        "analytics",
        "fiber",
        "sales",
        "purchase",
        "stock",
        "users",
    ];

    return validMenus.includes(saved as MenuId)
        ? (saved as MenuId)
        : "dashboard";
}