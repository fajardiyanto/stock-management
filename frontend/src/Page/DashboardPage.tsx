import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { User } from '../types/user';
import { MenuId } from '../types';
import UserManagementPage from './UserManagementPage';
import { Routes, Route, useNavigate } from "react-router-dom";
import SalesManagementPage from './SalesManagementPage';
import PurchasingManagementPage from './PurchasingManagementPage';
import StockManagementPage from './StockManagementPage';
import CreatePurchasingPage from './CreatePurchasingPage';
import UpdateStockPage from './UpdateStockPage';
import StockSortManagementPage from './StockSortManagementPage';

interface DashboardProps {
    onLogout: () => void;
}

const DashboardPage: React.FC<DashboardProps> = ({ onLogout }) => {
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard');
    const [userData, setUserData] = useState<User | null>(null);

    useEffect(() => {
        const user = authService.getUser();
        setUserData(user);
    }, []);

    const handleLogout = () => {
        authService.logout();
        onLogout();
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                isOpen={sidebarOpen}
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                activeMenu={activeMenu}
                setActiveMenu={(menu) => {
                    setActiveMenu(menu);
                    navigate(`/dashboard/${menu}`);
                }}
                onLogout={handleLogout}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar activeMenu={activeMenu} userData={userData} />

                <main className="flex-1 overflow-y-auto p-6">
                    {/* max-w-9xl  */}
                    <div className="mx-auto">
                        <Routes>
                            <Route path="users" element={<UserManagementPage />} />
                            <Route path="sales" element={<SalesManagementPage />} />
                            <Route path="purchase" element={<PurchasingManagementPage />} />
                            <Route path="stock" element={<StockManagementPage />} />
                            <Route path="purchase/create" element={<CreatePurchasingPage />} />
                            <Route path="stock/update/:stockId" element={<UpdateStockPage />} />
                            <Route path="stock/sort/:stockItemId" element={<StockSortManagementPage />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;