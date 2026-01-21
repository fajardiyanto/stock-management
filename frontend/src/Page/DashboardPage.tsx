import React, { useState } from "react";
import { authService } from "../services/authService";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { MenuId } from "../types";
import UserManagementPage from "./UserManagementPage";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import SalesManagementPage from "./SalesManagementPage";
import PurchasingManagementPage from "./PurchasingManagementPage";
import StockManagementPage from "./StockManagementPage";
import CreatePurchasingPage from "./CreatePurchasingPage";
import UpdateStockPage from "./UpdateStockPage";
import StockSortManagementPage from "./StockSortManagementPage";
import FiberManagementPage from "./FiberManagementPage";
import SaleCreationPage from "./SaleCreationPage";
import SaleUpdatePage from "./SaleUpdatePage";
import MultiplePrintInvoicePage from "./MultiplePrintInvoicePage";
import AnalyticsPage from "./AnalyticsPage";
import AuditLogPage from "./AuditTrailPage";
import { getDefaultActiveMenu } from "../utils/GetDefaultActiveMenu";
import DailyBookKeepingPage from "./DailyBookKeepingPage";

interface DashboardProps {
    onLogout: () => void;
}

const DashboardPage: React.FC<DashboardProps> = ({ onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [activeMenu, setActiveMenu] = useState<MenuId>(
        getDefaultActiveMenu()
    );
    const [maxWidth, setMaxWidth] = useState(
        localStorage.getItem("maxWidth") || ""
    );

    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        authService.logout();
        onLogout();
    };

    const isPrintPage = location.pathname === "/dashboard/print-invoice";
    if (isPrintPage) {
        return (
            <main className="p-6">
                <MultiplePrintInvoicePage />
            </main>
        );
    }

    const setActiveMenuButton = (menu: MenuId) => {
        setActiveMenu(menu);
        navigate(`/dashboard/${menu}`);
        localStorage.setItem("activeMenu", menu);
    };

    const handleWidthChange = (width: string) => {
        setMaxWidth(width);
        localStorage.setItem("maxWidth", width);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                isOpen={sidebarOpen}
                activeMenu={activeMenu}
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                setActiveMenu={(menu) => setActiveMenuButton(menu)}
                onLogout={handleLogout}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar
                    activeMenu={activeMenu}
                    onLogout={handleLogout}
                    onWidthChange={handleWidthChange}
                />
                <main className="flex-1 overflow-y-auto p-6">
                    {/* max-w-9xl  */}
                    <div className={`mx-auto ${maxWidth}`}>
                        <Routes>
                            <Route
                                path="users"
                                element={<UserManagementPage />}
                            />
                            <Route
                                path="sales"
                                element={<SalesManagementPage />}
                            />
                            <Route
                                path="purchase"
                                element={<PurchasingManagementPage />}
                            />
                            <Route
                                path="stock"
                                element={<StockManagementPage />}
                            />
                            <Route
                                path="purchase/create"
                                element={<CreatePurchasingPage />}
                            />
                            <Route
                                path="stock/update/:stockId"
                                element={<UpdateStockPage />}
                            />
                            <Route
                                path="stock/sort/:stockItemId"
                                element={<StockSortManagementPage />}
                            />
                            <Route
                                path="fiber"
                                element={<FiberManagementPage />}
                            />
                            <Route
                                path="sales/create"
                                element={<SaleCreationPage />}
                            />
                            <Route
                                path="sales/update/:saleId"
                                element={<SaleUpdatePage />}
                            />
                            <Route
                                path="print-invoice"
                                element={<MultiplePrintInvoicePage />}
                            />
                            <Route
                                path="analytics"
                                element={<AnalyticsPage />}
                            />
                            <Route
                                path="bookkeeping"
                                element={<DailyBookKeepingPage />}
                            />
                            <Route path="audit" element={<AuditLogPage />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;
