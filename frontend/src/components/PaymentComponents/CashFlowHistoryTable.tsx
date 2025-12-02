import React from 'react';
import { User } from '../../types/user';
import { CashFlowResponse, PaymentType, PaymentResponse } from '../../types/payment';
import { formatRupiah } from '../../utils/FormatRupiah';
import { formatDate } from '../../utils/FormatDate';
import { Trash2 } from 'lucide-react';

interface CashFlowHistoryTableProps {
    user: User;
    cashFlows: CashFlowResponse;
    onRemove: (cashFlow: PaymentResponse) => void;
}

const CashFlowHistoryTable: React.FC<CashFlowHistoryTableProps> = ({ user, cashFlows, onRemove }) => {
    const getTipeBadge = (tipe: PaymentType) => {
        const style = tipe === 'INCOME' ? 'bg-green-700 text-white' : 'bg-red-700 text-white';
        return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${style}`}>{tipe}</span>;
    };

    return (
        <div className="space-y-4">
            <div className="pt-4">
                <h4 className="text-xl font-bold text-gray-700">Riwayat Cash Flow</h4>
                <p className="text-gray-500 text-sm mt-1">Riwayat transaksi keuangan untuk "{user.name}"</p>
            </div>

            <div className="mt-4 overflow-x-auto border rounded-xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Keterangan</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipe</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {!cashFlows.payment || cashFlows.payment?.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-lg">
                                    No cash flow found.
                                </td>
                            </tr>
                        ) : (
                            cashFlows?.payment?.map((entry, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(entry.created_at)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.description}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${entry.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatRupiah(entry.total)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getTipeBadge(entry.type)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {entry.purchase_id === "" || entry.type === 'EXPENSE' || entry.sales_id === "" ? (
                                            <button
                                                type="button"
                                                onClick={() => onRemove(entry)}
                                                className="p-3 mb-0.5 text-red-500 hover:text-red-700 rounded-lg transition"
                                                title="Remove Entry"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default CashFlowHistoryTable;