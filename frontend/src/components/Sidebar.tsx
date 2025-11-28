import React from 'react';
import { Users, LogOut, X, Menu, ShoppingBasket, ShoppingBag, Warehouse, BoxIcon } from 'lucide-react';
import { MenuId, MenuItem } from '../types';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
    activeMenu: MenuId;
    setActiveMenu: (menu: MenuId) => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    toggleSidebar,
    activeMenu,
    setActiveMenu,
    onLogout
}) => {
    const menuItems: MenuItem[] = [
        { id: 'fiber', label: 'Management Fiber', icon: BoxIcon },
        { id: 'sales', label: 'Management Penjualan', icon: ShoppingBag },
        { id: 'purchase', label: 'Management Pembelian', icon: ShoppingBasket },
        { id: 'stock', label: 'Management Stok', icon: Warehouse },
        { id: 'users', label: 'Management Akun', icon: Users },
    ];

    return (
        <aside
            className={`${isOpen ? 'w-64' : 'w-20'
                } bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col`}
        >
            <div className="p-4 flex items-center justify-between">
                {isOpen && <h1 className="text-xl font-bold">Stock Fish Management</h1>}
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-800 transition"
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-3 py-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveMenu(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-2 transition ${activeMenu === item.id
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800'
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