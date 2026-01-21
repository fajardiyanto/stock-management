import React from "react";
import { ChevronRight, Edit2, Trash2 } from "lucide-react";
import StockRowShrinkage from "./StockRowShrinkage";
import { formatRupiah } from "../../utils/FormatRupiah";
import { StockEntry, StockItem, StockSortResponse } from "../../types/stock";
import { formatDate } from "../../utils/FormatDate";

interface StockRowDetailsProps {
    item: StockItem;
    stockEntry: StockEntry;
    itemIndex: number;
    totalItems: number;
    onSort: () => void;
    onEditStock: (stockId: string) => void;
    onDeleteStock: (stockId: string, stockCode: string) => void;
}

const StockRowDetails: React.FC<StockRowDetailsProps> = ({
    item,
    stockEntry,
    itemIndex,
    totalItems,
    onSort,
    onEditStock,
    onDeleteStock,
}) => {
    const isFirstRow = itemIndex === 0;
    const isSorted = item.is_sorted;

    const allSorts = item.stock_sorts || [];
    const marketableSorts = allSorts.filter((s) => !s.is_shrinkage);
    const shrinkageSort = allSorts.find((s) => s.is_shrinkage);

    const rowClass = isFirstRow ? "border-t-2 border-gray-400" : "";

    const calculateTotalRowsForStock = () => {
        let total = 0;
        stockEntry.stock_items.forEach((stockItem) => {
            if (stockItem.is_sorted && stockItem.stock_sorts) {
                const marketable = stockItem.stock_sorts.filter(
                    (s) => !s.is_shrinkage
                );
                const hasShrinkage = stockItem.stock_sorts.some(
                    (s) => s.is_shrinkage
                );
                total +=
                    Math.max(1, marketable.length) + (hasShrinkage ? 1 : 0);
            } else {
                total += 1;
            }
        });
        return total;
    };

    const totalStockRows = calculateTotalRowsForStock();

    const totalItemRows = marketableSorts.length + (shrinkageSort ? 1 : 0);

    const ageColor =
        stockEntry.age_in_day > 100
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800";

    const onToggleShrinkage = () => {
        console.log("Toggle Susut status");
    };

    const renderStockEntryColumns = (rowSpan: number) => (
        <React.Fragment>
            <td
                rowSpan={rowSpan}
                className="px-6 py-4 text-sm font-bold text-gray-900 align-middle text-center border-r border-gray-200"
            >
                {stockEntry.stock_code}
            </td>
            <td
                rowSpan={rowSpan}
                className="px-6 py-4 text-sm text-gray-700 align-middle text-center border-r border-gray-200"
            >
                {stockEntry.supplier.name}
            </td>
            <td
                rowSpan={rowSpan}
                className="px-6 py-4 text-sm text-gray-600 align-middle text-center border-r border-gray-200"
            >
                {formatDate(stockEntry.purchase_date)}
            </td>
            <td
                rowSpan={rowSpan}
                className="px-6 py-4 align-middle text-center border-r border-gray-200"
            >
                <span
                    className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${ageColor}`}
                >
                    {stockEntry.age_in_day} Hari
                </span>
            </td>
        </React.Fragment>
    );

    const renderItemDetailsColumns = (rowSpan: number | null) => (
        <React.Fragment>
            <td
                rowSpan={rowSpan || 1}
                className="px-4 py-4 text-sm text-gray-800 font-semibold text-center align-middle border-l border-gray-200"
            >
                {item.item_name}
            </td>
            <td
                rowSpan={rowSpan || 1}
                className="px-2 py-4 text-sm text-gray-700 text-center align-middle"
            >
                {item.weight}
            </td>
            <td
                rowSpan={rowSpan || 1}
                className="px-2 py-4 text-sm text-gray-700 text-center align-middle"
            >
                {formatRupiah(item.price_per_kilogram)}
            </td>
            <td
                rowSpan={rowSpan || 1}
                className="px-2 py-4 text-sm font-semibold text-gray-900 text-center align-middle border-r border-gray-200"
            >
                {formatRupiah(item.total_payment)}
            </td>
        </React.Fragment>
    );

    const renderSortActionColumn = (
        actionText: string,
        rowSpan: number | null = null,
        sortItem: StockSortResponse | null = null
    ) => (
        <td
            rowSpan={rowSpan || 1}
            className="px-4 py-4 text-center border-l border-gray-200 align-middle"
        >
            <button
                onClick={onSort}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold transition border rounded-lg px-4 py-1.5 bg-white ${actionText === "Sortir"
                    ? "text-blue-600 hover:text-blue-800 border-blue-300 hover:bg-blue-50"
                    : "text-gray-700 hover:text-gray-900 border-gray-300 hover:bg-gray-50"
                    } ${sortItem?.weight !== sortItem?.current_weight
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                disabled={sortItem?.weight !== sortItem?.current_weight}
            >
                <ChevronRight size={16} />
                {actionText}
            </button>
        </td>
    );

    const renderStockActionsColumn = (
        rowSpan: number,
        sortItem: StockSortResponse | null = null
    ) => (
        <td
            rowSpan={rowSpan}
            className="px-6 py-4 align-middle border-l border-gray-200"
        >
            <div className="flex justify-center items-center gap-2">
                <button
                    onClick={() => onEditStock(stockEntry.uuid)}
                    className={`border border-gray-300 p-2 rounded-lg hover:bg-gray-100 text-blue-600 transition 
                        ${sortItem?.weight !== sortItem?.current_weight
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                    title="Edit Stock"
                    disabled={sortItem?.weight !== sortItem?.current_weight}
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={() =>
                        onDeleteStock(stockEntry.uuid, stockEntry.stock_code)
                    }
                    className="border border-gray-300 p-2 rounded-lg hover:bg-gray-100 text-red-600 transition"
                    title="Delete Stock"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </td>
    );

    if (!isSorted) {
        return (
            <tr className={`bg-white hover:bg-gray-50 transition ${rowClass}`}>
                {isFirstRow && renderStockEntryColumns(totalStockRows)}

                {renderItemDetailsColumns(null)}

                <td className="px-2 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                    -
                </td>
                <td className="px-2 py-4 text-sm text-gray-700 text-center">
                    -
                </td>
                <td className="px-2 py-4 text-sm font-semibold text-gray-700 text-center">
                    -
                </td>
                <td className="px-2 py-4 text-sm font-bold text-green-600 text-center">
                    -
                </td>
                <td className="px-2 py-4 text-sm font-semibold text-gray-900 text-center border-r border-gray-200">
                    -
                </td>

                <td className="px-2 py-4 text-sm text-gray-700 text-center">
                    <button
                        onClick={onToggleShrinkage}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg transition bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                        Tidak
                    </button>
                </td>

                {renderSortActionColumn("Sortir")}

                {isFirstRow && renderStockActionsColumn(totalStockRows)}
            </tr>
        );
    }

    if (isSorted && marketableSorts.length === 0 && shrinkageSort) {
        return (
            <tr className={`bg-white hover:bg-gray-50 transition ${rowClass}`}>
                {isFirstRow && renderStockEntryColumns(totalStockRows)}

                {renderItemDetailsColumns(null)}

                <td className="px-2 py-4 text-red-600 font-bold text-sm text-center border-l border-gray-200">
                    susut
                </td>
                <td className="px-2 py-4 text-red-600 font-semibold text-sm text-center">
                    {formatRupiah(shrinkageSort.price_per_kilogram)}
                </td>
                <td className="px-2 py-4 text-red-600 font-bold text-sm text-center">
                    {shrinkageSort.weight}
                </td>
                <td className="px-2 py-4 text-gray-400 font-semibold text-sm text-center">
                    -
                </td>
                <td className="px-2 py-4 text-red-600 font-bold text-sm text-center border-r border-gray-200">
                    {formatRupiah(shrinkageSort.total_cost)}
                </td>
                <td className="px-2 py-4 text-sm text-center">
                    <button
                        onClick={onToggleShrinkage}
                        className="px-4 py-1.5 text-xs font-bold rounded-lg transition bg-red-600 text-white hover:bg-red-700"
                    >
                        Ya
                    </button>
                </td>

                {renderSortActionColumn("Edit Sortir")}

                {isFirstRow && renderStockActionsColumn(totalStockRows)}
            </tr>
        );
    }

    return (
        <React.Fragment>
            {marketableSorts.map((sortItem, index) => {
                const isFirstItemRow = index === 0;

                return (
                    <tr
                        key={sortItem.uuid}
                        className={`bg-white hover:bg-gray-50 transition ${isFirstRow && isFirstItemRow ? rowClass : ""
                            }`}
                    >
                        {isFirstRow &&
                            isFirstItemRow &&
                            renderStockEntryColumns(totalStockRows)}

                        {isFirstItemRow
                            ? renderItemDetailsColumns(totalItemRows)
                            : null}

                        <td className="px-2 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                            {sortItem.sorted_item_name}
                        </td>
                        <td className="px-2 py-4 text-sm text-gray-700 text-center">
                            {formatRupiah(sortItem.price_per_kilogram)}
                        </td>
                        <td className="px-2 py-4 text-sm font-semibold text-gray-700 text-center">
                            {sortItem.weight}
                        </td>
                        <td
                            className={`px-2 py-4 text-sm font-bold text-center ${sortItem.current_weight === 0
                                ? "text-yellow-400"
                                : "text-green-600"
                                }`}
                        >
                            {sortItem.current_weight}
                        </td>
                        <td className="px-2 py-4 text-sm font-semibold text-gray-900 text-center border-r border-gray-200">
                            {formatRupiah(sortItem.total_cost)}
                        </td>
                        <td className="px-2 py-4 text-sm text-center">
                            <button
                                onClick={onToggleShrinkage}
                                className="px-4 py-1.5 text-xs font-semibold rounded-lg transition bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                Tidak
                            </button>
                        </td>

                        {isFirstItemRow &&
                            renderSortActionColumn(
                                "Edit Sortir",
                                totalItemRows,
                                sortItem
                            )}

                        {isFirstRow &&
                            isFirstItemRow &&
                            renderStockActionsColumn(totalStockRows, sortItem)}
                    </tr>
                );
            })}

            {shrinkageSort && marketableSorts.length > 0 && (
                <StockRowShrinkage
                    shrinkageItem={shrinkageSort}
                    onToggleShrinkage={onToggleShrinkage}
                />
            )}
        </React.Fragment>
    );
};

export default StockRowDetails;
