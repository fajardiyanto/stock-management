import React, { useCallback, useEffect, useState } from "react";
import StockFilter from "../components/StockComponents/StockFilter";
import StockTable from "../components/StockComponents/StockTable";
import {
    StockEntriesFilters,
    StockEntry,
    StockConfirmRequest,
} from "../types/stock";
import { useToast } from "../contexts/ToastContext";
import { stockService } from "../services/stockService";
import { useNavigate } from "react-router-dom";
import StockModalDelete from "../components/StockComponents/StockModalDelete";

const StockManagementPage: React.FC = () => {
    const [stockData, setStockData] = useState<StockEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState<string>("");
    const [totalStockData, setTotalStockData] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [filters, setFilters] = useState<StockEntriesFilters>({});
    const [modalType, setModalType] = useState<"DELETE" | null>(null);
    const [stockConfirmData, setStockConfirmData] =
        useState<StockConfirmRequest | null>();

    const { showToast } = useToast();
    const navigate = useNavigate();

    const fetchStockEntries = useCallback(async () => {
        setLoading(true);
        setError("");

        const activeFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v)
        );

        try {
            const response = await stockService.getStockEntries({
                page: currentPage,
                size: pageSize,
                ...activeFilters,
            });
            if (response.status_code === 200) {
                setStockData(response.data.data);
                setTotalStockData(response.data.total);
            } else {
                setError(response.message || "Failed to fetch purchasing data");
                showToast(
                    response.message || "Failed to fetch purchasing data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch stock entries. Please try again");
            showToast(
                "Failed to fetch stock entries. Please try again",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filters, showToast]);

    useEffect(() => {
        fetchStockEntries();
    }, [fetchStockEntries]);

    const handleSearch = (newFilters: StockEntriesFilters) => {
        setCurrentPage(1);
        setFilters(newFilters);
    };

    const handleReset = () => {
        if (Object.keys(filters).length === 0 && currentPage === 1) return;

        setFilters({});
        setCurrentPage(1);
    };

    const handleSortItem = (stockItemId: string, itemIndex: number) => {
        navigate(`/dashboard/stock/sort/${stockItemId}`);
    };

    const handleEditStock = (stockId: string) => {
        navigate(`/dashboard/stock/update/${stockId}`);
    };

    const handleDeleteStock = (stockId: string, stockCode: string) => {
        setStockConfirmData({
            stock_id: stockId,
            stock_code: stockCode,
        });
        setModalType("DELETE");
    };

    const handleConfirmDeleted = async () => {
        try {
            const response = await stockService.deleteStock(
                stockConfirmData?.stock_id || ""
            );

            if (response.status_code === 200) {
                showToast("Stock deleted successfully!", "success");
                handleCloseModal();
                fetchStockEntries();
            } else {
                showToast(
                    `Failed to delete stock: ${response.message}`,
                    "error"
                );
            }
        } catch (err) {
            showToast("Failed to delete stock. Please try again.", "error");
        }
    };

    const handleCloseModal = () => {
        setModalType(null);
    };

    const totalPages = Math.ceil(totalStockData / pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 || newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    if (loading && stockData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Loading Stock Entries...</div>
            </div>
        );
    }

    if (error && stockData.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{error}</p>
                <button
                    onClick={fetchStockEntries}
                    className="mt-4 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center mb-4 bg-white p-6 rounded-xl shadow-md">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">
                        Manajemen Stok
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Kelola stok ikan dari supplier
                    </p>
                </div>
            </header>

            <StockFilter onSearch={handleSearch} onReset={handleReset} />

            <StockTable
                data={stockData}
                currentPage={currentPage}
                pageSize={pageSize}
                totalPurchases={totalStockData}
                totalPages={totalPages}
                loading={loading}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onSortItem={handleSortItem}
                onEditStock={handleEditStock}
                onDeleteStock={handleDeleteStock}
            />

            {modalType === "DELETE" && (
                <StockModalDelete
                    item={stockConfirmData}
                    onConfirm={handleConfirmDeleted}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default StockManagementPage;
