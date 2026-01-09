import React from "react";
import { SaleEntry } from "../../types/sales";
import {
    Calendar,
    DollarSign,
    PencilIcon,
    Printer,
    Trash2,
} from "lucide-react";
import { formatRupiah } from "../../utils/FormatRupiah";
import { formatDate, formatDateRawUTC } from "../../utils/FormatDate";
import { PaymentStatusLabel, PAYMENT_STATUS } from "../../types/payment";

interface SaleItemRowProps {
    sale: SaleEntry;
    onDelete: (sale_id: string, sale_code: string) => void;
    handleOpenPayment: (data: SaleEntry) => void;
    handleEditSale: (data: SaleEntry) => void;
    handleOpenPaymentDeposit: (data: SaleEntry) => void;
}

const SaleItemRow: React.FC<SaleItemRowProps> = ({
    sale,
    onDelete,
    handleOpenPayment,
    handleEditSale,
    handleOpenPaymentDeposit,
}) => {
    const handlePrintNota = () => {
        window.open(`/dashboard/print-invoice?saleId=${sale.uuid}`, "_blank");
    };

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

    // Check if we should use fiber_groups or sold_items
    const hasFiberGroups = sale.fiber_groups && sale.fiber_groups.length > 0;

    // Build rows data structure
    interface RowData {
        item: any;
        fiberName: string;
        isFirstInFiberGroup: boolean;
        fiberGroupSize: number;
        addOnIndex: number | null; // Track which add-on to show in this row
    }

    const buildRows = (): RowData[] => {
        let rows: RowData[] = [];
        let itemRowCount = 0;

        if (hasFiberGroups) {
            sale.fiber_groups.forEach((fiberGroup) => {
                fiberGroup.items.forEach((item, itemIndex) => {
                    rows.push({
                        item: item,
                        fiberName: fiberGroup.fiber_name,
                        isFirstInFiberGroup: itemIndex === 0,
                        fiberGroupSize: fiberGroup.items.length,
                        addOnIndex: itemRowCount,
                    });
                    itemRowCount++;
                });
            });
        } else {
            // Use sold_items with matching fibers
            sale.sold_items.forEach((item, idx) => {
                const matchingFibers = sale.fiber_used?.filter(
                    (fiber) => fiber.stock_sort_id === item.stock_sort_id
                );
                rows.push({
                    item: item,
                    fiberName:
                        matchingFibers?.map((f) => f.name).join(", ") || "",
                    isFirstInFiberGroup: true,
                    fiberGroupSize: 1,
                    addOnIndex: idx,
                });
                itemRowCount++;
            });
        }

        // If we have more add-ons than item rows, create additional rows for remaining add-ons
        const addOnCount = sale.add_ons?.length || 0;
        if (addOnCount > itemRowCount && rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            for (let i = itemRowCount; i < addOnCount; i++) {
                rows.push({
                    item: null, // No item for this row, just add-on
                    fiberName: "",
                    isFirstInFiberGroup: false,
                    fiberGroupSize: 0,
                    addOnIndex: i,
                });
            }
        }

        return rows;
    };

    const rows = buildRows();
    const totalRows = rows.length;

    return (
        <>
            {rows.map((rowData, rowIndex) => {
                const isFirstRow = rowIndex === 0;
                const item = rowData.item;
                const addOn =
                    rowData.addOnIndex !== null &&
                    sale.add_ons &&
                    rowData.addOnIndex < sale.add_ons.length
                        ? sale.add_ons[rowData.addOnIndex]
                        : null;

                return (
                    <tr
                        key={`${sale.uuid}-${item?.id || "addon"}-${rowIndex}`}
                        className="border border-gray-300 hover:bg-gray-50 transition"
                    >
                        {/* SALE INFO - Only on first row */}
                        {isFirstRow && (
                            <>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm font-bold text-gray-900 align-middle"
                                >
                                    {sale.sale_code}
                                </td>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-600 align-middle"
                                >
                                    {sale.customer.name}
                                </td>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-500 align-middle"
                                >
                                    {formatDateRawUTC(sale.sales_date)}
                                </td>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-500 align-middle"
                                >
                                    {sale.payment_late_day}
                                </td>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-500 align-middle"
                                >
                                    {sale.export_sale ? "Ya" : "Tidak"}
                                </td>
                            </>
                        )}

                        {/* ITEM DETAILS - Only render if item exists */}
                        {item ? (
                            <>
                                <td className="px-6 py-4 border border-gray-300 font-bold text-sm text-gray-600">
                                    {item.stock_code}
                                </td>
                                <td className="px-6 py-4 border border-gray-300 text-sm text-gray-800">
                                    {item.stock_sort_name}
                                </td>
                                <td className="px-6 py-4 border border-gray-300 text-sm text-gray-600">
                                    {formatRupiah(item.price_per_kilogram)}
                                </td>
                                <td className="px-6 py-4 border border-gray-300 text-sm text-gray-600">
                                    {item.weight} kg
                                </td>
                                <td className="px-6 py-4 border border-gray-300 text-sm text-gray-800">
                                    {formatRupiah(item.total_amount)}
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="px-6 py-4 border border-gray-300 text-sm text-gray-400">
                                    -
                                </td>
                                <td className="px-6 py-4 border border-gray-300 text-sm text-gray-400">
                                    -
                                </td>
                                <td className="px-6 py-4 border border-gray-300 text-sm text-gray-400">
                                    -
                                </td>
                                <td className="px-6 py-4 border border-gray-300 text-sm text-gray-400">
                                    -
                                </td>
                                <td className="px-6 py-4 border border-gray-300 text-sm text-gray-400">
                                    -
                                </td>
                            </>
                        )}

                        {/* FIBER COLUMN - Show fiber name with rowSpan for grouped items */}
                        {item && rowData.isFirstInFiberGroup && (
                            <td
                                rowSpan={rowData.fiberGroupSize}
                                className="px-6 py-4 border border-gray-300 text-sm text-gray-600 align-middle"
                            >
                                {rowData.fiberName ? (
                                    <div className="bg-blue-100 rounded px-2 py-1 text-center">
                                        {rowData.fiberName}
                                    </div>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                        )}
                        {!item && (
                            <td className="px-6 py-4 border border-gray-300 text-sm text-gray-400">
                                -
                            </td>
                        )}

                        {/* ADD ONS - Each add-on in its own row */}
                        <td className="px-6 py-4 border border-gray-300 text-sm text-gray-600 align-middle">
                            {addOn ? addOn.addon_name : "-"}
                        </td>
                        <td className="px-6 py-4 border border-gray-300 text-sm text-gray-600 align-middle">
                            {addOn ? formatRupiah(addOn.addon_price) : "-"}
                        </td>

                        {/* PAYMENT INFO - Only on first row */}
                        {isFirstRow && (
                            <>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-900 align-middle"
                                >
                                    {formatRupiah(sale.total_amount)}
                                </td>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-900 align-middle"
                                >
                                    {formatRupiah(sale.paid_amount)}
                                </td>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-900 align-middle"
                                >
                                    {formatRupiah(sale.remaining_amount)}
                                </td>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm align-middle"
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
                                            (sale.paid_amount /
                                                sale.total_amount) *
                                            100
                                        ).toFixed(1)}
                                        %
                                    </p>
                                </td>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-500 align-middle"
                                >
                                    {formatDate(sale.last_payment_date) || "-"}
                                </td>

                                {/* ACTIONS */}
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-right text-sm font-medium align-middle"
                                >
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEditSale(sale)}
                                            title="Edit Penjualan"
                                            className="p-2 text-blue-500 hover:text-blue-800"
                                        >
                                            <PencilIcon size={18} />
                                        </button>

                                        {sale.payment_status !==
                                            PAYMENT_STATUS.FULL && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleOpenPaymentDeposit(
                                                            sale
                                                        )
                                                    }
                                                    title="Tambah Pembayaran Deposit"
                                                    className="p-2 text-yellow-400 hover:text-yellow-700"
                                                >
                                                    <DollarSign size={18} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleOpenPayment(sale)
                                                    }
                                                    title="Jadwalkan Pembayaran"
                                                    className="p-2 text-green-500 hover:text-green-800"
                                                >
                                                    <Calendar size={18} />
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={handlePrintNota}
                                            title="Cetak Nota"
                                            className="p-2 text-purple-500 hover:text-purple-800"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                onDelete(
                                                    sale.uuid,
                                                    sale.sale_code
                                                )
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
                );
            })}
        </>
    );
};

export default SaleItemRow;
