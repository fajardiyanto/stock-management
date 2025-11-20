import React, { useState } from "react";
import StockFilter from "../components/StockManagement/StockFilter";
import StockTable from "../components/StockManagement/StockTable";
import { Stock } from "../types/stock";

const MOCK_STOCK_DATA: Stock[] = [
    {
        id: "STOCK9",
        supplier: "PT. Nelayan Nusantara",
        createdDate: '18 Nov 2025, 21:31',
        ageInDays: 2,
        items: [
            {
                name: "Ikan",
                weight: 19,
                pricePerKilogram: 1000000,
                total: 19000000,
            },
            {
                name: "perahu",
                weight: 20,
                pricePerKilogram: 1000000,
                total: 20000000,
            },
        ]
    },
    {
        id: "STOCK8",
        supplier: "CV. Sumber Laut Jaya",
        createdDate: '15 Nov 2025, 17:12',
        ageInDays: 5,
        items: [
            {
                name: "Cumi",
                weight: 10,
                pricePerKilogram: 50000,
                total: 500000,
            },
        ]
    },
];

const StockManagementPage: React.FC = () => {
    const [stockData, setStockData] = useState<Stock[]>(MOCK_STOCK_DATA);
    const [filters, setFilters] = useState({});

    const handleSearch = (newFilters: any) => {
        setFilters(newFilters);
        console.log("Applying stock filters:", newFilters);
    };

    const handleReset = () => {
        setFilters({});
        setStockData(MOCK_STOCK_DATA);
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

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">Manajemen Stok</h1>
                    <p className="text-gray-500 mt-1">Kelola stok ikan dari supplier</p>
                </div>
            </header>

            {/* Filter Section */}
            <StockFilter onSearch={handleSearch} onReset={handleReset} />

            {/* Table Section */}
            <StockTable
                data={stockData}
                onSortItem={handleSortItem}
                onEditStock={handleEditStock}
                onDeleteStock={handleDeleteStock}
            />
        </div>
    );
};

export default StockManagementPage;