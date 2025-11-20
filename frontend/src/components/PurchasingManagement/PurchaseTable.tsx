import React from 'react';
import { Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import PurchaseStatusBadge from './PurchaseStatusBadge';
import { formatRupiah } from '../../utils/FormatRupiah';
import { Purchasing, PaymentStatusLabel } from '../../types/purchase';
import { formatDate } from '../../utils/FormatDate';

interface PurchaseTableProps {
    data: Purchasing[];
}

const PurchaseTable: React.FC<PurchaseTableProps> = ({ data }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Pembelian</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bayar</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dibayar</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sisa</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Pembayaran</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Bayar</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {data.map((item, index) => {
                            const percentage = (item.paid_amount / item.total_amount) * 100;
                            const idx = index + 1;
                            return (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{idx}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.supplier.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800`}>
                                            {item.stock_entry.stock_code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.purchase_date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{formatRupiah(item.total_amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRupiah(item.paid_amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRupiah(item.remaining_amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <PurchaseStatusBadge
                                            status={PaymentStatusLabel[item.payment_status]}
                                            percentage={percentage}
                                            paidAmount={item.paid_amount}
                                            totalAmount={item.total_amount}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.last_payment)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition" title="Edit">
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center p-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">Showing 1 to {data.length} of {data.length} entries</span>
                <div className="flex space-x-2">
                    <button className="p-2 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50" disabled><ChevronLeft size={16} /></button>
                    <button className="px-3 py-1 border rounded-lg bg-blue-600 text-white text-sm">1</button>
                    <button className="p-2 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50" disabled><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseTable;