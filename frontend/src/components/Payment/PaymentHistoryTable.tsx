import React from 'react';
import { PaymentResponse } from '../../types/payment';
import { formatRupiah } from '../../utils/FormatRupiah';
import { formatDate } from '../../utils/FormatDate';

interface PaymentHistoryTableProps {
    data: PaymentResponse[];
}

const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({ data }) => (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
                <tr>
                    {['Tanggal', 'Jumlah', 'Keterangan'].map(header => (
                        <th
                            key={header}
                            className="px-6 py-3 text-xs text-left font-semibold text-gray-500 uppercase tracking-wider"
                        >
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-lg">
                            No payment found for this purchasing history.
                        </td>
                    </tr>
                ) : (
                    data.map((entry, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(entry.created_at)}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-700">{formatRupiah(entry.total)}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{entry.description}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

export default PaymentHistoryTable