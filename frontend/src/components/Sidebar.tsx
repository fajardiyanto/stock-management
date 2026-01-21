import React from "react";
import {
    Users,
    LogOut,
    X,
    Menu,
    ShoppingBasket,
    ShoppingBag,
    Warehouse,
    BoxIcon,
    HomeIcon,
    Activity,
    BookAIcon,
} from "lucide-react";
import { MenuId, MenuItem, UserRole } from "../types";
import { authService } from "../services/authService";

interface SidebarProps {
    isOpen: boolean;
    activeMenu: MenuId;
    toggleSidebar: () => void;
    setActiveMenu: (menu: MenuId) => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    activeMenu,
    toggleSidebar,
    setActiveMenu,
    onLogout,
}) => {
    const menuItems: MenuItem[] = [
        {
            id: "analytics",
            label: "Dashboard",
            icon: HomeIcon,
            roles: ["SUPER_ADMIN", "ADMIN"],
        },
        {
            id: "fiber",
            label: "Management Fiber",
            icon: BoxIcon,
            roles: ["SUPER_ADMIN", "ADMIN"],
        },
        {
            id: "sales",
            label: "Management Penjualan",
            icon: ShoppingBag,
            roles: ["SUPER_ADMIN", "ADMIN"],
        },
        {
            id: "purchase",
            label: "Management Pembelian",
            icon: ShoppingBasket,
            roles: ["SUPER_ADMIN", "ADMIN"],
        },
        {
            id: "stock",
            label: "Management Stok",
            icon: Warehouse,
            roles: ["SUPER_ADMIN", "ADMIN"],
        },
        {
            id: "users",
            label: "Management Akun",
            icon: Users,
            roles: ["SUPER_ADMIN"],
        },
        {
            id: "bookkeeping",
            label: "Pembukuan Harian",
            icon: BookAIcon,
            roles: ["SUPER_ADMIN"],
        },
        {
            id: "audit",
            label: "Audit Trail",
            icon: Activity,
            roles: ["SUPER_ADMIN"],
        },
    ];

    const userData = authService.getUser();
    const filteredMenuItems = menuItems.filter((item) =>
        item.roles.includes(userData?.role as UserRole)
    );

    return (
        <aside
            className={`${isOpen ? "w-64" : "w-20"
                } bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col`}
        >
            <div className="p-4 flex items-center justify-between">
                {isOpen && (
                    <h1 className="text-xl font-bold">Stock Fish Management</h1>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-800 transition"
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-3 py-4">
                {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveMenu(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-2 transition ${activeMenu === item.id
                                ? "bg-blue-600 text-white"
                                : "text-gray-300 hover:bg-gray-800"
                                }`}
                        >
                            <Icon size={20} />
                            {isOpen && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-gray-800">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition"
                >
                    <LogOut size={20} />
                    {isOpen && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
