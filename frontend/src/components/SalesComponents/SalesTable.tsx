import React, { useState } from "react";
import { SaleEntry } from "../../types/sales";
import SaleItemRow from "./SaleItemRow";
import Pagination from "../Pagination";
import { useToast } from "../../contexts/ToastContext";
import { paymentService } from "../../services/paymentService";
import { PaymentResponse } from "../../types/payment";
import RecordSalesPaymentModal from "./RecordSalesPaymentModal";
import { useNavigate } from "react-router-dom";
import SalesPaymentModal from "./SalesPaymentModal";

interface SalesTableProps {
    data: SaleEntry[];
    currentPage: number;
    pageSize: number;
    totalPurchases: number;
    totalPages: number;
    loading: boolean;
    onPageSizeChange: (newSize: number) => void;
    onPageChange: (newPage: number) => void;
    onDelete: (sale_id: string, sale_code: string) => void;
    onRefresh: () => void;
}

const SalesTable: React.FC<SalesTableProps> = ({
    data,
    currentPage,
    pageSize,
    totalPurchases,
    totalPages,
    loading,
    onPageSizeChange,
    onPageChange,
    onDelete,
    onRefresh,
}) => {
    const [sales, setSales] = useState<SaleEntry>({} as SaleEntry);
    const [modalType, setModalType] = useState<"ADD" | "EDIT" | null>(null);
    const [payments, setPayments] = useState<PaymentResponse[]>([]);
    const [error, setError] = useState<string>("");

    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleOpenPayment = async (data: SaleEntry) => {
        setModalType("ADD");
        setSales(data);

        try {
            const response = await paymentService.getAllPaymentBField(
                data.uuid,
                "sale"
            );

            if (response.status_code === 200) {
                setPayments(response.data.payment);
            } else {
                setError(response.message || "Failed to fetch cash flows");
                showToast(
                    response.message || "Failed to fetch cash flows",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch cash flows. Please try again.");
            showToast("Failed to fetch cash flows. Please try again.", "error");
        }
    };

    const handleEditSale = async (data: SaleEntry) => {
        navigate(`/dashboard/sales/update/${data.uuid}`);
    };

    const handleOpenPaymentDeposit = async (data: SaleEntry) => {
        setModalType("EDIT");
        setSales(data);
    };

    const handleCloseModal = () => {
        setModalType(null);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 border-collapse">
                    <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]"
                            >
                                ID
                            </th>
                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[10rem]"
                            >
                                Pembeli
                            </th>
                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[12rem]"
                            >
                                Tanggal Dibuat
                            </th>
                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]"
                            >
                                Hari Terlambat
                            </th>
                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]"
                            >
                                Jual Luar?
                            </th>

                            <th
                                colSpan={6}
                                className="px-6 py-2 border border-gray-300 text-center text-xs font-semibold text-gray-700 bg-blue-100 border-l border-r"
                            >
                                Item
                            </th>

                            <th
                                colSpan={2}
                                className="px-6 py-2 border border-gray-300 text-center text-xs font-semibold text-gray-700 bg-green-100 border-l border-r"
                            >
                                AddOns
                            </th>

                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]"
                            >
                                Total
                            </th>
                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]"
                            >
                                Total Dibayarkan
                            </th>
                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]"
                            >
                                Sisa Dibayarkan
                            </th>
                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[10rem]"
                            >
                                Status Pembayaran
                            </th>
                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[12rem]"
                            >
                                Tanggal Pembayaran
                            </th>
                            <th
                                rowSpan={2}
                                className="px-6 py-3 border border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[10rem]"
                            >
                                Aksi
                            </th>
                        </tr>

                        <tr>
                            <th className="px-6 py-1 border border-gray-300 text-xs text-center text-gray-700 bg-blue-100 min-w-[7rem]">
                                ID Stok
                            </th>
                            <th className="px-6 py-1 border border-gray-300 text-xs text-center text-gray-700 bg-blue-100 min-w-[10rem]">
                                Nama Item
                            </th>
                            <th className="px-6 py-1 border border-gray-300 text-xs text-center text-gray-700 bg-blue-100 min-w-[8rem]">
                                Harga (per Kg)
                            </th>
                            <th className="px-6 py-1 border border-gray-300 text-xs text-center text-gray-700 bg-blue-100 min-w-[8rem]">
                                Berat (kg)
                            </th>
                            <th className="px-6 py-1 border border-gray-300 text-xs text-center text-gray-700 bg-blue-100 min-w-[8rem]">
                                Sub Total
                            </th>
                            <th className="px-6 py-1 border border-gray-300 text-xs text-center text-gray-700 bg-blue-100 min-w-[8rem]">
                                Fiber
                            </th>
                            <th className="px-6 py-1 border border-gray-300 text-xs text-center text-gray-700 bg-green-100 min-w-[10rem]">
                                Nama Tambahan
                            </th>
                            <th className="px-6 py-1 border border-gray-300 text-xs text-center text-gray-700 bg-green-100 min-w-[8rem]">
                                Harga Tambahan
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {data.map((sale) => (
                            <SaleItemRow
                                key={`${sale.uuid}`}
                                sale={sale}
                                onDelete={onDelete}
                                handleOpenPayment={handleOpenPayment}
                                handleEditSale={handleEditSale}
                                handleOpenPaymentDeposit={
                                    handleOpenPaymentDeposit
                                }
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {modalType === "ADD" && (
                <RecordSalesPaymentModal
                    sale={sales}
                    payments={payments}
                    error={error}
                    onClose={handleCloseModal}
                    onRefresh={onRefresh}
                />
            )}

            {modalType === "EDIT" && (
                <SalesPaymentModal
                    sale={sales}
                    onClose={handleCloseModal}
                    onRefresh={onRefresh}
                />
            )}

            <Pagination
                entryName="sales"
                currentPage={currentPage}
                pageSize={pageSize}
                totalData={totalPurchases}
                totalPages={totalPages}
                loading={loading}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
};

export default SalesTable;
