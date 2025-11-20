import React from 'react';

interface PurchaseStatusBadgeProps {
    status: string;
    percentage: number;
    paidAmount: number;
    totalAmount: number;
}

const PurchaseStatusBadge: React.FC<PurchaseStatusBadgeProps> = ({ status, percentage, paidAmount, totalAmount }) => {
    let statusClass = '';
    let barColor = '';

    if (status === 'Lunas' || percentage === 100) {
        statusClass = 'text-green-800 bg-green-100';
        barColor = 'bg-green-500';
    } else if (percentage > 0 && percentage < 100) {
        statusClass = 'text-yellow-800 bg-yellow-100';
        barColor = 'bg-yellow-500';
    } else {
        statusClass = 'text-red-800 bg-red-100';
        barColor = 'bg-red-500';
    }

    return (
        <div className="flex flex-col space-y-1 w-28">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full text-center ${statusClass}`}>
                {status}
            </span>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className={`text-xs text-center font-medium ${statusClass.split(' ')[0]}`}>
                {percentage.toFixed(0)}%
            </span>
        </div>
    );
};

export default PurchaseStatusBadge;