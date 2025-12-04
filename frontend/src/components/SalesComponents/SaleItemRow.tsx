import React from "react";
import { SoldItem, SaleEntry } from "../../types/sales";
import { Calendar, PencilIcon, Printer, Trash2 } from "lucide-react";
import { formatRupiah } from "../../utils/FormatRupiah";
import { formatDate } from "../../utils/FormatDate";
import { PaymentStatusLabel } from "../../types/payment";

interface SaleItemRowProps {
    sale: SaleEntry;
    item: SoldItem;
    itemIndex: number;
    totalItems: number;
    onDelete: (sale_id: string, sale_code: string) => void;
    handleOpenPayment: (data: SaleEntry) => void;
    handleEditSale: (data: SaleEntry) => void;
}

const SaleItemRow: React.FC<SaleItemRowProps> = ({
    sale,
    item,
    itemIndex,
    totalItems,
    onDelete,
    handleOpenPayment,
    handleEditSale,
}) => {
    const isFirstRow = itemIndex === 0;

    const addOn =
        isFirstRow && sale.add_ons.length > 0 ? sale.add_ons[0] : null;

    const getPaymentBadge = (status: SaleEntry["payment_status"]) => {
        let style = "bg-gray-100 text-gray-800";
        if (status === "PAYMENT_IN_FULL") style = "bg-green-100 text-green-800";
        else if (status === "PARTIAL_PAYMENT")
            style = "bg-yellow-100 text-yellow-800";
        return (
            <span
                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}
            >
                {PaymentStatusLabel[status]}
            </span>
        );
    };

    const handlePrintNota = () => {
        window.open(`/dashboard/print-invoice?saleId=${sale.uuid}`, "_blank");
    };

    return (
        <>
            <tr
                className={`hover:bg-gray-50 transition border-t-2 ${
                    isFirstRow ? "border-gray-300" : "border-none"
                }`}
            >
                {isFirstRow && (
                    <>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm font-bold text-gray-900 align-middle"
                        >
                            {sale.sale_code}
                        </td>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm text-gray-600 align-middle"
                        >
                            {sale.customer.name}
                        </td>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm text-gray-500 align-middle"
                        >
                            {formatDate(sale.sales_date)}
                        </td>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm text-gray-500 align-middle"
                        >
                            {sale.payment_late_day}
                        </td>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm text-gray-500 align-middle"
                        >
                            {sale.export_sale ? "Ya" : "Tidak"}
                        </td>
                    </>
                )}

                <td className="px-6 py-4 font-bold text-sm text-gray-600">
                    {item.stock_code}
                </td>
                <td className="px-6 py-4 text-sm text-gray-800">
                    {item.stock_sort_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                    {formatRupiah(item.price_per_kilogram)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                    {item.weight} kg
                </td>
                <td className="px-6 py-4 text-sm text-gray-800">
                    {formatRupiah(item.total_amount)}
                </td>

                <td className="px-6 py-4 font-bold text-sm text-gray-600">
                    {addOn?.addon_name || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                    {addOn ? formatRupiah(addOn.addon_price) : "-"}
                </td>
                <td
                    rowSpan={isFirstRow ? totalItems : 1}
                    className="px-6 py-4 text-sm text-gray-600 align-middle"
                >
                    {isFirstRow &&
                        sale.fiber_used.map((fiber, index) => (
                            <div
                                key={index}
                                className="bg-blue-100 rounded px-2 py-1 mb-1 text-center"
                            >
                                {fiber.name}
                            </div>
                        ))}
                </td>

                {isFirstRow && (
                    <>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm text-gray-900 align-middle"
                        >
                            {formatRupiah(sale.total_amount)}
                        </td>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm text-gray-900 align-middle"
                        >
                            {formatRupiah(sale.paid_amount)}
                        </td>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm text-gray-900 align-middle"
                        >
                            {formatRupiah(sale.remaining_amount)}
                        </td>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm align-middle"
                        >
                            {getPaymentBadge(sale.payment_status)}
                            <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{
                                        width: `${
                                            (sale.paid_amount /
                                                sale.total_amount) *
                                            100
                                        }%`,
                                    }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {(
                                    (sale.paid_amount / sale.total_amount) *
                                    100
                                ).toFixed(1)}
                                %
                            </p>
                        </td>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm text-gray-500 align-middle"
                        >
                            {formatDate(sale.last_payment_date) || "-"}
                        </td>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-right text-sm font-medium align-middle"
                        >
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => handleEditSale(sale)}
                                    title="Edit Penjualan"
                                    className="p-2 text-blue-500 hover:text-blue-800"
                                >
                                    <PencilIcon size={18} />
                                </button>
                                <button
                                    onClick={() => handleOpenPayment(sale)}
                                    title="Tambah Pembayaran"
                                    className="p-2 text-green-500 hover:text-green-800"
                                >
                                    <Calendar size={18} />
                                </button>
                                <button
                                    onClick={handlePrintNota}
                                    title="Cetak Nota"
                                    className="p-2 text-gray-500 hover:text-gray-800"
                                >
                                    <Printer size={18} />
                                </button>
                                <button
                                    onClick={() =>
                                        onDelete(sale.uuid, sale.sale_code)
                                    }
                                    title="Hapus Penjualan"
                                    className="p-2 text-red-500 hover:text-red-800"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </td>
                    </>
                )}
            </tr>
        </>
    );
};

export default SaleItemRow;
