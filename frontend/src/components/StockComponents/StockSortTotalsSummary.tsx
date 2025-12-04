import React from "react";

interface SortTotalsSummaryProps {
    totalSortedWeight: number;
    remainingWeight: number;
}

const StockSortTotalsSummary: React.FC<SortTotalsSummaryProps> = ({
    totalSortedWeight,
    remainingWeight,
}) => {
    const isOverWeight = remainingWeight < 0;

    return (
        <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500">
                    Total Berat Sortir
                </p>
                <p className="text-xl font-bold text-gray-800 mt-1">
                    {totalSortedWeight} kg
                </p>
            </div>
            <div
                className={`p-4 rounded-lg shadow-sm ${
                    isOverWeight ? "bg-red-50" : "bg-green-50"
                }`}
            >
                <p className="text-sm font-medium text-gray-500">
                    Sisa Berat Setelah Sortir
                </p>
                <p
                    className={`text-xl font-bold mt-1 ${
                        isOverWeight ? "text-red-600" : "text-green-600"
                    }`}
                >
                    {Math.abs(remainingWeight)} kg
                </p>
                {isOverWeight && (
                    <p className="text-xs text-red-500 mt-1">
                        PERINGATAN: Berat melebihi batas total!
                    </p>
                )}
            </div>
        </div>
    );
};

export default StockSortTotalsSummary;
