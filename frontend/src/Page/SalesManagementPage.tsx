import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import SalesFilter from '../components/SalesComponents/SalesFilter';
import SalesTable from '../components/SalesComponents/SalesTable';
import { SaleConfirmRequest, SaleEntry } from '../types/sales';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../services/salesService';
import { useToast } from '../contexts/ToastContext';
import SaleModalDelete from "../components/SalesComponents/SaleModalDelete";

const SalesManagementPage: React.FC = () => {
    const [salesData, setSalesData] = useState<SaleEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalSales, setTotalSales] = useState(0);
    const [error, setError] = useState<string>('');
    const [modalType, setModalType] = useState<'DELETE' | null>(null);
    const [saleConfirmData, setSaleConfirmData] = useState<SaleConfirmRequest | null>(null);

    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSearch = useCallback((newFilters: any) => {
        setLoading(true);
        setFilters(newFilters);
        console.log("Applying sales filters:", newFilters);
        setTimeout(() => {
            const filtered = salesData.filter(sale => {
                const searchMatch = !newFilters.pencarian || sale.customer.name.toLowerCase().includes(newFilters.pencarian.toLowerCase()) || sale.sale_code.toLowerCase().includes(newFilters.pencarian.toLowerCase());
                const statusMatch = !newFilters.status_pembayaran || sale.payment_status === newFilters.status_pembayaran;
                return searchMatch && statusMatch;
            });
            setSalesData(filtered);
            setLoading(false);
        }, 500);
    }, []);

    const handleReset = () => {
        setSalesData(salesData);
        setFilters({});
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
    }

    const handleAddSale = () => {
        navigate('/dashboard/sales/create');
    };

    const fetchSalesData = useCallback(async () => {
        setLoading(true);

        try {
            const response = await salesService.getAllSales();
            if (response.status_code === 200) {
                setSalesData(response.data);
                // setTotalSales(response.data.total);
            } else {
                setError(response.message || "Failed to fetch purchasing data");
                showToast(
                    response.message || "Failed to fetch purchasing data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch stock entries. Please try again");
            showToast("Failed to fetch stock entries. Please try again", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSalesData();
    }, [fetchSalesData]);

    const onHandleDeleteSale = async (sale_id: string, sale_code: string) => {
        setSaleConfirmData({
            sale_id: sale_id,
            sale_code: sale_code
        });
        setModalType('DELETE');
    }

    const handleConfirmDeleted = async () => {
        try {
            const response = await salesService.deleteSale(saleConfirmData?.sale_id || '');

            if (response.status_code === 200) {
                showToast('Sale deleted successfully!', 'success');
                handleCloseModal();
                fetchSalesData();
            } else {
                showToast(`Failed to delete sale: ${response.message}`, 'error');
            }
        } catch (err) {
            showToast('Failed to delete sale. Please try again.', 'error');
        }
    }

    const handleCloseModal = () => {
        setModalType(null);
    };

    if (error) {
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
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">Manajemen Penjualan</h1>
                    <p className="text-gray-500 mt-1">Kelola data penjualan ikan ke pembeli</p>
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

            <SalesFilter onSearch={handleSearch} onReset={handleReset} onAddSale={handleAddSale} />

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
            />

            {modalType === 'DELETE' && (
                <SaleModalDelete item={saleConfirmData} onConfirm={handleConfirmDeleted} onClose={handleCloseModal} />
            )}
        </div>
    );
};

export default SalesManagementPage;