import React, { useCallback, useEffect, useState } from "react";
import PurchaseFilter from "../components/PurchasingManagement/PurchaseFilter";
import PurchaseTable from "../components/PurchasingManagement/PurchaseTable";
import { Plus } from "lucide-react";
import { Purchasing, PurchaseFilters } from "../types/purchase";
import { purchaseService } from "../services/purchaseService";
import { useToast } from "../contexts/ToastContext";
import { useNavigate } from "react-router-dom";

const PurchasingManagementPage: React.FC = () => {
    const [purchaseData, setPurchaseData] = useState<Purchasing[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState<string>("");
    const [totalPurchases, setTotalPurchases] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [filters, setFilters] = useState<PurchaseFilters>({});

    const { showToast } = useToast();
    const navigate = useNavigate();

    const fetchPurchases = useCallback(async () => {
        setLoading(true);
        setError("");

        const activeFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v)
        );

        try {
            const response = await purchaseService.getAllPurchases({
                page: currentPage,
                size: pageSize,
                ...activeFilters,
            });

            if (response.status_code === 200) {
                setPurchaseData(response.data.data);
                setTotalPurchases(response.data.total);
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
    }, [currentPage, pageSize, filters, showToast]);

    useEffect(() => {
        fetchPurchases();
    }, [fetchPurchases]);

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    }

    const handleSearch = (newFilters: PurchaseFilters) => {
        setCurrentPage(1);
        setFilters(newFilters);
    };

    const handleReset = () => {
        if (Object.keys(filters).length === 0 && currentPage === 1) return;

        setFilters({});
        setCurrentPage(1);
    };

    const handleAddStock = () => {
        navigate("/dashboard/purchase/create");
    };

    const totalPages = Math.ceil(totalPurchases / pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (loading && purchaseData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Loading purchases...</div>
            </div>
        );
    }

    if (error && purchaseData.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{error}</p>
                <button
                    onClick={fetchPurchases}
                    className="mt-4 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-gray-800">
                    Manajemen Pembelian
                </h1>

                <button
                    onClick={handleAddStock}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition transform hover:scale-105"
                >
                    <Plus size={20} />
                    Tambah Pembelian
                </button>
            </header>

            <PurchaseFilter onSearch={handleSearch} onReset={handleReset} />

            <PurchaseTable
                data={purchaseData}
                currentPage={currentPage}
                pageSize={pageSize}
                totalPurchases={totalPurchases}
                totalPages={totalPages}
                loading={loading}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
            />
        </div>
    );
};

export default PurchasingManagementPage;