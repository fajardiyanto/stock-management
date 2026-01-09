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
    const rows =
        sale.fiber_groups && sale.fiber_groups.length > 0
            ? sale.fiber_groups.flatMap((fiberGroup) =>
                  fiberGroup.items.map((item, index) => ({
                      ...item,
                      __fiberName: fiberGroup.fiber_name,
                      __fiberRowSpan: index === 0 ? fiberGroup.items.length : 0,
                  }))
              )
            : sale.sold_items.map((item, index) => ({
                  ...item,
                  __fiberName: "",
                  __fiberRowSpan: index === 0 ? sale.sold_items.length : 0,
              }));

    const totalRows = rows.length;

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

    return (
        <>
            {rows.map((item, itemIndex) => {
                const isFirstRow = itemIndex === 0;
                const addOn =
                    isFirstRow && sale.add_ons.length > 0
                        ? sale.add_ons[0]
                        : null;

                return (
                    <tr
                        key={`${sale.uuid}-${item.id}-${itemIndex}`}
                        className={`border border-gray-300 hover:bg-gray-50 transition border-t`}
                    >
                        {/* SALE INFO */}
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

                        {/* ITEM */}
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

                        {/* ✅ FIBER COLUMN (CORRECT) */}
                        {item.__fiberRowSpan > 0 && (
                            <td
                                rowSpan={item.__fiberRowSpan}
                                className="px-6 py-4 border border-gray-300 align-middle"
                            >
                                <div
                                    className={`${
                                        item.__fiberName ? "bg-blue-100" : ""
                                    } rounded px-2 py-1 text-center`}
                                >
                                    {item.__fiberName}
                                </div>
                            </td>
                        )}

                        {/* ADD ONS */}
                        {isFirstRow && (
                            <>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-600 align-middle"
                                >
                                    {sale.add_ons && sale.add_ons.length > 0
                                        ? sale.add_ons.map((addOn, index) => (
                                              <div
                                                  key={addOn.id}
                                                  className={`py-1 ${
                                                      index <
                                                      sale.add_ons.length - 1
                                                          ? "border-b border-gray-300"
                                                          : ""
                                                  }`}
                                              >
                                                  {addOn.addon_name}
                                              </div>
                                          ))
                                        : "-"}
                                </td>

                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-600 align-middle"
                                >
                                    {sale.add_ons && sale.add_ons.length > 0
                                        ? sale.add_ons.map((addOn, index) => (
                                              <div
                                                  key={addOn.id}
                                                  className={`py-1 ${
                                                      index <
                                                      sale.add_ons.length - 1
                                                          ? "border-b border-gray-300"
                                                          : ""
                                                  }`}
                                              >
                                                  {formatRupiah(
                                                      addOn.addon_price
                                                  )}
                                              </div>
                                          ))
                                        : "-"}
                                </td>
                            </>
                        )}

                        {/* ADD ONS + TOTAL */}
                        {isFirstRow && (
                            <>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-900"
                                >
                                    {formatRupiah(sale.total_amount)}
                                </td>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-900"
                                >
                                    {formatRupiah(sale.paid_amount)}
                                </td>
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-900"
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
                                    className="px-6 py-4 border border-gray-300 text-sm text-gray-500"
                                >
                                    {formatDate(sale.last_payment_date) || "-"}
                                </td>

                                {/* ACTIONS */}
                                <td
                                    rowSpan={totalRows}
                                    className="px-6 py-4 border border-gray-300 text-right"
                                >
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEditSale(sale)}
                                            className="p-2 text-blue-500"
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
                                                    className="p-2 text-yellow-500"
                                                >
                                                    <DollarSign size={18} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleOpenPayment(sale)
                                                    }
                                                    className="p-2 text-green-500"
                                                >
                                                    <Calendar size={18} />
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={handlePrintNota}
                                            className="p-2 text-purple-500"
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
                                            className="p-2 text-red-500"
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
