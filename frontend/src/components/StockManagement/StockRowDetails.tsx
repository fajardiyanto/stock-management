import React from "react";
import { ChevronRight, Edit2, Trash2 } from "lucide-react";
import StockRowSusut from "./StockRowSusut";
import { formatRupiah } from "../../utils/FormatRupiah";
import {
    Purchasing,
    StockEntry,
    StockItem,
    StockSortResponse,
} from "../../types/purchase";
import { formatDate } from "../../utils/FormatDate";

interface StockRowDetailsProps {
    item: StockItem;
    stockEntry: StockEntry;
    purchase: Purchasing;
    itemIndex: number;
    totalItems: number;
    onSort: () => void;
    onEditStock: (stockId: string) => void;
    onDeleteStock: (stockId: string) => void;
}

const StockRowDetails: React.FC<StockRowDetailsProps> = ({
    item,
    stockEntry,
    purchase,
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

    const rowClass = isFirstRow ? "border-t-2 border-gray-300" : "";
    const totalItemRows = isSorted ? Math.max(1, marketableSorts.length) : 1;

    const handleToggleSusut = () => {
        console.log("Toggle Susut status");
    };

    const renderSortColumns = (sortItem: StockSortResponse | null) => (
        <>
            <td className="px-2 py-4 text-sm text-gray-700 text-center whitespace-nowrap">
                {sortItem ? sortItem.sorted_item_name : "-"}
            </td>
            <td className="px-2 py-4 text-sm text-gray-700 text-center whitespace-nowrap">
                {sortItem ? formatRupiah(sortItem.price_per_kilogram) : "-"}
            </td>
            <td className="px-2 py-4 text-sm text-gray-700 text-center whitespace-nowrap">
                {sortItem?.weight || "-"}{" "}
            </td>
            <td className="px-2 py-4 text-sm text-gray-700 text-center whitespace-nowrap">
                {sortItem?.current_weight || "-"}{" "}
            </td>
            <td className="px-2 py-4 text-sm text-gray-700 text-center whitespace-nowrap">
                {sortItem ? formatRupiah(sortItem.total_cost) : "-"}
            </td>
            <td className="px-2 py-4 text-sm text-gray-700 text-center whitespace-nowrap">
                <button
                    onClick={handleToggleSusut}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${sortItem?.is_shrinkage
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    {sortItem?.is_shrinkage ? "Ya" : "Tidak"}
                </button>
            </td>
        </>
    );

    if (!isSorted) {
        return (
            <tr className={`bg-white hover:bg-gray-50 transition ${rowClass}`}>
                {isFirstRow && (
                    <>
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm font-bold text-gray-900 text-center align-middle !align-middle"
                        >
                            {stockEntry.stock_code}
                        </td>

                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm text-gray-600 text-center align-middle !align-middle"
                        >
                            {purchase.supplier.name}
                        </td>

                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 text-sm text-gray-500 text-center align-middle !align-middle"
                        >
                            {formatDate(purchase.purchase_date)}
                        </td>

                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 whitespace-nowrap text-center align-middle !align-middle"
                        >
                            <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {stockEntry.age_in_day} Hari
                            </span>
                        </td>
                    </>
                )}

                {!isFirstRow && (
                    <>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4"></td>
                    </>
                )}

                <td className="px-6 py-4 text-sm text-gray-700 font-medium whitespace-nowrap">
                    {item.item_name}
                </td>
                <td className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {item.weight} <span className="text-xs text-gray-500">Kg</span>
                </td>
                <td className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {formatRupiah(item.price_per_kilogram)}
                </td>
                <td className="px-2 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {formatRupiah(item.total_payment)}
                </td>

                {renderSortColumns(null)}

                <td
                    className="px-6 py-4 text-right whitespace-nowrap"
                    rowSpan={totalItems}
                >
                    <button
                        onClick={onSort}
                        className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition float-right border border-gray-300 rounded-lg px-3 py-1 bg-white hover:bg-gray-50"
                    >
                        <ChevronRight size={16} />
                        Sortir
                    </button>
                </td>

                {isFirstRow && (
                    <td
                        rowSpan={totalItems}
                        className="px-6 py-4 text-right whitespace-nowrap align-middle"
                    >
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => onEditStock(stockEntry.uuid)}
                                className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50 text-blue-600 transition"
                                title="Edit Stock"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => onDeleteStock(stockEntry.uuid)}
                                className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50 text-red-600 transition"
                                title="Delete Stock"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                )}
            </tr>
        );
    }

    return (
        <React.Fragment>
            {marketableSorts.map((sortItem, index) => (
                <tr
                    key={sortItem.uuid}
                    className={`bg-white hover:bg-gray-50 transition ${rowClass}`}
                >
                    {isFirstRow && index === 0 && (
                        <>
                            <td
                                rowSpan={totalItems}
                                className="px-6 py-4 text-sm font-bold text-gray-900 align-middle"
                            >
                                {stockEntry.stock_code}
                            </td>
                            <td
                                rowSpan={totalItems}
                                className="px-6 py-4 text-sm text-gray-600 align-middle"
                            >
                                {purchase.supplier.name}
                            </td>
                            <td
                                rowSpan={totalItems}
                                className="px-6 py-4 text-sm text-gray-500 align-middle"
                            >
                                {formatDate(purchase.purchase_date)}
                            </td>
                            <td
                                rowSpan={totalItems}
                                className="px-6 py-4 whitespace-nowrap align-middle"
                            >
                                <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    {stockEntry.age_in_day} Hari
                                </span>
                            </td>
                        </>
                    )}

                    {index === 0 ? (
                        <>
                            <td
                                className="px-6 py-4 text-sm text-gray-700 font-medium whitespace-nowrap align-middle"
                                rowSpan={totalItemRows}
                            >
                                {item.item_name}
                            </td>
                            <td
                                className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap"
                                rowSpan={totalItemRows}
                            >
                                {item.weight} <span className="text-xs text-gray-500">Kg</span>
                            </td>
                            <td
                                className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap"
                                rowSpan={totalItemRows}
                            >
                                {formatRupiah(item.price_per_kilogram)}
                            </td>
                            <td
                                className="px-2 py-4 text-sm text-gray-900 whitespace-nowrap"
                                rowSpan={totalItemRows}
                            >
                                {formatRupiah(item.total_payment)}
                            </td>
                        </>
                    ) : null}

                    {renderSortColumns(sortItem)}

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                            onClick={onSort}
                            className={`flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-800 transition float-right border border-gray-300 rounded-lg px-3 py-1 bg-white hover:bg-gray-50`}
                        >
                            <ChevronRight size={16} />
                            Edit Sortir
                        </button>
                    </td>

                    {isFirstRow && index === 0 && (
                        <td
                            rowSpan={totalItems}
                            className="px-6 py-4 whitespace-nowrap align-middle"
                        >
                            <div className="flex justify-center items-center h-full gap-2">
                                <button
                                    onClick={() => onEditStock(stockEntry.uuid)}
                                    className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50 text-blue-600 transition"
                                    title="Edit Stock"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => onDeleteStock(stockEntry.uuid)}
                                    className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50 text-red-600 transition"
                                    title="Delete Stock"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </td>
                    )}
                </tr>
            ))}

            {shrinkageSort && (
                <StockRowSusut
                    shrinkageItem={shrinkageSort}
                    onToggleSusut={handleToggleSusut}
                />
            )}
        </React.Fragment>
    );
};

export default StockRowDetails;
