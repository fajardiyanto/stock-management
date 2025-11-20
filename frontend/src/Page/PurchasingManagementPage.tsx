import React, { useCallback, useEffect, useState } from "react";
import PurchaseFilter from "../components/PurchasingManagement/PurchaseFilter";
import PurchaseTable from "../components/PurchasingManagement/PurchaseTable";
import { Plus } from 'lucide-react';
import { Purchasing } from "../types/purchase";
import { purchaseService } from "../services/purchaseService";
import { useToast } from "../contexts/ToastContext";

const MOCK_PURCHASE_DATA = [
    {
        id: "BUY91",
        supplier: "PT. Melayani Nusantara",
        stock: 'STOCK1',
        purchaseDate: '18 Nov 2025',
        totalPayment: 26000000,
        paid: 20000000,
        remainingPayment: 6000000,
        paymentStatus: "Sebagian",
        paymentDate: '-',
    },
    {
        id: "BUY88",
        supplier: "CV. Sumber Laut Jaya",
        stock: 'STOCK2',
        purchaseDate: '16 Nov 2025',
        totalPayment: 1000,
        paid: 500,
        remainingPayment: 500,
        paymentStatus: "Sebagian",
        paymentDate: '-',
    },
    {
        id: "BUY87",
        supplier: "UD. Laut Biru",
        stock: 'STOCK3',
        purchaseDate: '15 Nov 2025',
        totalPayment: 500000,
        paid: 0,
        remainingPayment: 500000,
        paymentStatus: "Belum Dibayar",
        paymentDate: '-',
    },
    {
        id: "BUY87",
        supplier: "Fisher",
        stock: 'STOCK4',
        purchaseDate: '15 Nov 2025',
        totalPayment: 15000000,
        paid: 0,
        remainingPayment: 15000000,
        paymentStatus: "Belum Dibayar",
        paymentDate: '-',
    },
    {
        id: "BUY81",
        supplier: "ABI",
        stock: 'STOCK5',
        purchaseDate: '12 Nov 2025',
        totalPayment: 240000,
        paid: 240000,
        remainingPayment: 0,
        paymentStatus: "Lunas",
        paymentDate: '12 Nov 2025',
    },
    {
        id: "BUY82",
        supplier: "ABI",
        stock: 'STOCK6',
        purchaseDate: '12 Nov 2025',
        totalPayment: 2112000,
        paid: 2112000,
        remainingPayment: 0,
        paymentStatus: "Lunas",
        paymentDate: '12 Nov 2025',
    },
    {
        id: "BUY83",
        supplier: "Kaleng",
        stock: 'STOCK7',
        purchaseDate: '12 Nov 2025',
        totalPayment: 5000000,
        paid: 5000000,
        remainingPayment: 0,
        paymentStatus: "Lunas",
        paymentDate: '12 Nov 2025',
    },
];

const PurchasingManagementPage: React.FC = () => {
    const [purchaseData, setPurchaseData] = useState<Purchasing[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState<string>('');
    const [totalPurchases, setTotalPurchases] = useState(0);
    const [filters, setFilters] = useState({});

    const pageSize = 20;
    const { showToast } = useToast();

    const fetchPurchases = useCallback(async () => {
            setLoading(true);
            setError('');

            try {
                const response = await purchaseService.getAllPurchases({
                    page: currentPage,
                    size: pageSize,
                })
                if (response.status_code === 200) {
                    setPurchaseData(response.data.data);
                    setTotalPurchases(response.data.total);
                } else {
                    setError(response.message || 'Failed to fetch purchasing data');
                    showToast(response.message || 'Failed to fetch purchasing data', 'error');
                }
            } catch (err) {
                console.log('Error fetching purchasing', err);
                setError('Failed to fetch purchases. Please try again');
                showToast('Failed to fetch purchases. Please try again', 'error');
            } finally {
                setLoading(false);
            }
    }, [currentPage, pageSize, showToast]);

    useEffect(() => {
        fetchPurchases();
    }, [fetchPurchases])

    const handleSearch = (newFilters: any) => {
        setFilters(newFilters);
        console.log("Applying filters:", newFilters);
    };

    const handleReset = () => {
        setFilters({});
        // setPurchaseData(MOCK_PURCHASE_DATA);
    };

    const handleAddStock = () => {
        console.log("Opening Add Stock Modal/Page...");
    };

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-gray-800">Manajemen Pembelian</h1>
                
                <button
                    onClick={handleAddStock}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition transform hover:scale-105"
                >
                    <Plus size={20} />
                    Tambah Pembelian
                </button>
            </header>

            {/* Filter Section */}
            <PurchaseFilter onSearch={handleSearch} onReset={handleReset} />

            {/* Table Section */}
            <PurchaseTable data={purchaseData} />
        </div>
    );
}

export default PurchasingManagementPage;