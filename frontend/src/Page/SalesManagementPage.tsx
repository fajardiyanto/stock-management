import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import SalesFilter from "../components/SalesComponents/SalesFilter";
import SalesTable from "../components/SalesComponents/SalesTable";
import {
    SaleConfirmRequest,
    SaleEntry,
    BuyerOption,
    SaleFilter,
} from "../types/sales";
import { useNavigate } from "react-router-dom";
import { salesService } from "../services/salesService";
import { useToast } from "../contexts/ToastContext";
import SaleModalDelete from "../components/SalesComponents/SaleModalDelete";
import { authService } from "../services/authService";

const SalesManagementPage: React.FC = () => {
    const [salesData, setSalesData] = useState<SaleEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<SaleFilter>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalSales, setTotalSales] = useState(0);
    const [error, setError] = useState<string>("");
    const [modalType, setModalType] = useState<"DELETE" | null>(null);
    const [saleConfirmData, setSaleConfirmData] =
        useState<SaleConfirmRequest | null>(null);
    const [buyerList, setBuyerList] = useState<BuyerOption[]>([]);

    const navigate = useNavigate();
    const { showToast } = useToast();

    const fetchSalesData = useCallback(async () => {
        setLoading(true);
        setError("");

        const activeFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v)
        );

        try {
            const response = await salesService.getAllSales({
                page: currentPage,
                size: pageSize,
                ...activeFilters,
            });

            if (response.status_code === 200) {
                setSalesData(response.data.data);
                setTotalSales(response.data.total);
            } else {
                setError(response.message || "Failed to fetch sales data");
                showToast(
                    response.message || "Failed to fetch sales data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch sales data. Please try again");
            showToast("Failed to fetch sales data. Please try again", "error");
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage, pageSize, showToast]);

    const fetchBuyerOptions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authService.getListUserRoles("buyer");
            if (response.status_code === 200) {
                const defaultBuyer: any = { uuid: "", name: "Semua Buyer" };
                setBuyerList([defaultBuyer, ...response.data]);
            } else {
                setError(response.message || "Failed to fetch sales data");
                showToast(
                    response.message || "Failed to fetch sales data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch sales data. Please try again");
            showToast("Failed to fetch sales data. Please try again", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSalesData();
        fetchBuyerOptions();
    }, [fetchSalesData, fetchBuyerOptions]);

    const refreshSalesData = async () => {
        try {
            const response = await salesService.getAllSales({
                page: currentPage,
                size: pageSize,
            });

            if (response.status_code === 200) {
                setSalesData(response.data.data);
                setTotalSales(response.data.total);
            } else {
                setError(response.message || "Failed to fetch sales data");
                showToast(
                    response.message || "Failed to fetch sales data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch sales data. Please try again");
            showToast("Failed to fetch sales data. Please try again", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (newFilters: SaleFilter) => {
        setCurrentPage(1);
        setFilters(newFilters);
    };

    const handleReset = () => {
        if (Object.keys(filters).length === 0 && currentPage === 1) return;

        setSalesData(salesData);
        setFilters({});
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalSales / pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 || newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleAddSale = () => {
        navigate("/dashboard/sales/create");
    };

    const onHandleDeleteSale = async (sale_id: string, sale_code: string) => {
        setSaleConfirmData({
            sale_id: sale_id,
            sale_code: sale_code,
        });
        setModalType("DELETE");
    };

    const handleConfirmDeleted = async () => {
        try {
            const response = await salesService.deleteSale(
                saleConfirmData?.sale_id || ""
            );

            if (response.status_code === 200) {
                showToast("Sale deleted successfully!", "success");
                handleCloseModal();
                fetchSalesData();
            } else {
                showToast(
                    `Failed to delete sale: ${response.message}`,
                    "error"
                );
            }
        } catch (err) {
            showToast("Failed to delete sale. Please try again.", "error");
        }
    };

    const handleCloseModal = () => {
        setModalType(null);
    };

    if (loading && salesData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Loading sales...</div>
            </div>
        );
    }

    if (error && salesData.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{error}</p>
                <button
                    onClick={fetchSalesData}
                    className="mt-4 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">
                        Manajemen Penjualan
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Kelola data penjualan ikan ke pembeli
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition shadow-sm">
                        Cetak Nota
                    </button>
                    <button
                        onClick={handleAddSale}
                        className="flex items-center gap-1 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition"
                    >
                        <Plus size={20} /> Tambah Penjualan
                    </button>
                </div>
            </header>

            <SalesFilter
                buyerList={buyerList}
                onSearch={handleSearch}
                onReset={handleReset}
                onAddSale={handleAddSale}
            />

            <SalesTable
                data={salesData}
                currentPage={currentPage}
                pageSize={pageSize}
                totalPurchases={totalSales}
                totalPages={totalPages}
                loading={loading}
                onPageSizeChange={handlePageSizeChange}
                onPageChange={handlePageChange}
                onDelete={onHandleDeleteSale}
                onRefresh={refreshSalesData}
            />

            {modalType === "DELETE" && (
                <SaleModalDelete
                    item={saleConfirmData}
                    onConfirm={handleConfirmDeleted}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default SalesManagementPage;
