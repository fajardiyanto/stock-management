import React, { useState, useMemo } from 'react';
import { X, Calendar } from 'lucide-react';
import { Purchasing } from '../../types/purchase'
import { PaymentResponse, CreatePaymentReqeust } from '../../types/payment';
import PaymentHistoryTable from '../Payment/PaymentHistoryTable';
import { formatRupiah } from '../../utils/FormatRupiah';
import { cleanNumber } from '../../utils/CleanNumber';
import { useToast } from '../../contexts/ToastContext';
import { getDefaultDate } from '../../utils/DefaultDate';
import { paymentService } from '../../services/paymentService';

interface RecordPaymentModalProps {
    purchase: Purchasing;
    payments: PaymentResponse[];
    error: string;
    onClose: () => void;
    onRefresh: () => void;
}

const SummaryBox: React.FC<{ label: string; value: string; isRed?: boolean }> = ({ label, value, isRed }) => (
    <div className="flex flex-col">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-xl font-bold mt-1 ${isRed ? 'text-red-600' : 'text-gray-800'}`}>
            {value}
        </span>
    </div>
);

const ProgressBox: React.FC<{ label: string; value: string; isBlue?: boolean }> = ({ label, value, isBlue }) => (
    <div className="flex flex-col">
        <span className="text-sm text-blue-700 font-medium">{label}</span>
        <span className={`text-xl font-bold mt-1 ${isBlue ? 'text-blue-700' : 'text-blue-600'}`}>
            {value}
        </span>
    </div>
);

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ purchase, payments, error, onClose, onRefresh }) => {
    const [formData, setFormData] = useState<CreatePaymentReqeust>({
        purchase_id: '',
        purchase_date: getDefaultDate(),
        stock_code: '',
        total: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { showToast } = useToast();

    const rawPaymentAmount = useMemo(
        () => formData.total,
        [formData.total]
    );
    const remainingBefore = purchase.remaining_amount;

    const calculation = useMemo(() => {
        const afterRemaining = Math.max(0, remainingBefore - rawPaymentAmount);
        const paidAfter = purchase.paid_amount + rawPaymentAmount;
        const percentage = purchase.total_amount > 0 ? (paidAfter / purchase.total_amount) * 100 : 0;

        return {
            afterRemaining,
            paidAfter,
            percentage: Math.min(100, percentage),
        };
    }, [remainingBefore, rawPaymentAmount, purchase.paid_amount, purchase.total_amount]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setFormData({ ...formData, total: cleanNumber(rawValue) })
    };

    const handleAmountBlur = () => {
        setFormData(prev => ({
            ...prev,
            total: formData.total
        }));
    };

    const handleDateChange = (date: string) => {
        setFormData({ ...formData, purchase_date: date });
    };

    const handlePaymentAmountInput = (paymentAmount: number) => {
        setFormData({ ...formData, total: paymentAmount });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rawPaymentAmount <= 0) {
            showToast("Jumlah pembayaran harus lebih dari Rp 0.", 'error');
            return;
        }
        if (rawPaymentAmount > remainingBefore) {
            showToast(`Jumlah pembayaran melebihi sisa hutang: ${formatRupiah(remainingBefore)}.`, 'error');
            return;
        }

        setIsSubmitting(true);

        const formattedPurchaseDate = formData.purchase_date + ':00Z';
        const finalPayload: CreatePaymentReqeust = {
            ...formData,
            purchase_id: purchase.purchase_id,
            purchase_date: formattedPurchaseDate,
            stock_code: purchase.stock_code,
        };

        try {
            const response = await paymentService.createPaymentByPurchaseId(finalPayload);

            if (response.status_code === 201 || response.status_code === 200) {
                showToast("Berhasil melakukan pembayaran!", "success");
            } else {
                const errorMessage = response.message || "Gagal melakukan pembayaran. Coba lagi.";
                showToast(errorMessage, "error");
            }
        } catch (err) {
            const errorMessage = "Terjadi kesalahan jaringan atau server.";
            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
            onClose();
            onRefresh();
        }
    };

    if (error && payments.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 p-5">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Catat Pembayaran</h3>
                        <p className="text-sm text-gray-500">Status pembayaran akan otomatis berdasarkan jumlah yang dibayar</p>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">

                        <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl bg-gray-50">
                            <SummaryBox label="Total Pembelian" value={formatRupiah(purchase.total_amount)} />
                            <SummaryBox label="Sisa Pembayaran" value={formatRupiah(remainingBefore)} isRed />
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-lg font-semibold text-gray-800">Histori Pembayaran</h4>
                            <p className="text-sm text-gray-600 ">Riwayat pembayaran yang telah dicatat sebelumnya</p>

                            <PaymentHistoryTable data={payments} />
                        </div>

                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pembayaran</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">Rp</span>
                                    <input
                                        type="text"
                                        value={formData.total}
                                        onChange={handleAmountChange}
                                        onBlur={handleAmountBlur}
                                        placeholder={formatRupiah(remainingBefore).replace('Rp', '').trim()}
                                        className="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-right"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handlePaymentAmountInput(remainingBefore)}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        title="Use Remaining Amount"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pembayaran</label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={formData.purchase_date}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 pr-10"
                                        disabled={isSubmitting}
                                    />
                                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl bg-blue-50/50">
                            <ProgressBox label="Progress Pembayaran" value={`${calculation.percentage.toFixed(0)}%`} />
                            <ProgressBox label="Sisa Pembayaran" value={formatRupiah(calculation.afterRemaining)} isBlue />
                        </div>

                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 p-5 pt-4">
                        <button
                            onClick={onClose}
                            type="button"
                            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                            disabled={isSubmitting || rawPaymentAmount <= 0 || rawPaymentAmount > remainingBefore}
                        >
                            {isSubmitting ? 'Mencatat...' : 'Catat Pembayaran'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;