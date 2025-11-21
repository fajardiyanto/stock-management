import React, { useCallback, useEffect, useState } from "react";
import StockFilter from "../components/StockManagement/StockFilter";
import StockTable from "../components/StockManagement/StockTable";
import { Purchasing } from "../types/purchase";
import { useToast } from "../contexts/ToastContext";
import { purchaseService } from "../services/purchaseService";


const StockManagementPage: React.FC = () => {
    const [stockData, setStockData] = useState<Purchasing[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState<string>("");
    const [totalStockData, setTotalStockData] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [filters, setFilters] = useState({});

    const { showToast } = useToast();

    const fetchStockEntries = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await purchaseService.getAllPurchases({
                page: currentPage,
                size: pageSize,
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
            console.log("Error fetching purchasing", err);
            setError("Failed to fetch purchases. Please try again");
            showToast("Failed to fetch purchases. Please try again", "error");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, showToast]);

    useEffect(() => {
        fetchStockEntries();
    }, [fetchStockEntries]);

    const handleSearch = (newFilters: any) => {
        setFilters(newFilters);
        console.log("Applying filters:", newFilters);
    };

    const handleReset = () => {
        setFilters({});
        setStockData(stockData);
    };

    const handleSortItem = (stockId: string, itemIndex: number) => {
        console.log(`Sorting item index ${itemIndex} in stock ID ${stockId}`);
    };

    const handleEditStock = (stockId: string) => {
        console.log(`Editing stock ID ${stockId}`);
    };

    const handleDeleteStock = (stockId: string) => {
        console.log(`Deleting stock ID ${stockId}`);
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
    }

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
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">Manajemen Stok</h1>
                    <p className="text-gray-500 mt-1">Kelola stok ikan dari supplier</p>
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
        </div>
    );
};

export default StockManagementPage;