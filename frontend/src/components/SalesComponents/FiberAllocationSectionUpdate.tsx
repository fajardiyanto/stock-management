import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, ChevronDown, X } from "lucide-react";
import {
    SelectedSaleItem,
    FiberAllocation,
    FiberItemAllocationResponse,
} from "../../types/sales";
import { FiberList } from "../../types/fiber";
import { formatRupiah } from "../../utils/FormatRupiah";

interface FiberAllocationSectionUpdateProps {
    selectedItems: SelectedSaleItem[];
    fiberAllocations: FiberAllocation[];
    fiberList: FiberList[];
    exportSale: boolean;
    fiberItemAllocations?: FiberItemAllocationResponse[];
    onAllocate: (allocation: FiberAllocation) => void;
    onRemoveAllocation: (uuid: string) => void;
}

const FiberAllocationSectionUpdate: React.FC<
    FiberAllocationSectionUpdateProps
> = ({
    selectedItems,
    fiberAllocations,
    fiberList,
    exportSale,
    fiberItemAllocations = [],
    onAllocate,
    onRemoveAllocation,
}) => {
    const [selectedFiber, setSelectedFiber] = useState("");
    const [selectedItemToAllocate, setSelectedItemToAllocate] = useState<{
        [itemId: string]: string;
    }>({});
    const [error, setError] = useState("");

    const fiber = fiberList.find((f) => f.uuid === selectedFiber);

    const usedFiberIds = useMemo(() => {
        return new Set(fiberAllocations.map((alloc) => alloc.fiber_id));
    }, [fiberAllocations]);

    const availableFibers = fiberList.filter(
        (fiber) => !usedFiberIds.has(fiber.uuid)
    );

    const itemsNeedingAllocation = selectedItems
        .map((item) => {
            const allocatedFromNew = fiberAllocations
                .filter((alloc) => alloc.item_id === item.tempId)
                .reduce((sum, alloc) => sum + alloc.weight, 0);

            const allocatedFromExisting = fiberItemAllocations
                .filter(
                    (fiberItem) =>
                        fiberItem.stock_sort_id === item.stock_sort_id &&
                        fiberItem.stock_code === item.stock_code
                )
                .reduce((sum, fiberItem) => sum + fiberItem.weight, 0);

            const totalAllocated = allocatedFromNew + allocatedFromExisting;
            const remaining = item.weight - totalAllocated;
            return {
                ...item,
                remainingWeight: remaining > 0 ? remaining : 0,
            };
        })
        .filter((item) => item.remainingWeight > 0);

    const handleAllocationInputChange = (itemId: string, value: string) => {
        setSelectedItemToAllocate((prev) => ({
            ...prev,
            [itemId]: value,
        }));
    };

    const handleAddAllocation = () => {
        setError("");

        if (!fiber) {
            setError("Harap pilih unit Fiber.");
            return;
        }

        const allocationsToSubmit: FiberAllocation[] = [];
        let hasValidAllocation = false;

        itemsNeedingAllocation.forEach((item) => {
            const weight = parseFloat(selectedItemToAllocate[item.tempId]) || 0;

            if (weight > 0) {
                hasValidAllocation = true;

                if (weight > item.remainingWeight) {
                    setError(
                        `Alokasi berat untuk ${item.item_name} (${weight} kg) melebihi berat sisa (${item.remainingWeight} kg).`
                    );
                    return;
                }

                allocationsToSubmit.push({
                    item_id: item.tempId,
                    fiber_id: fiber.uuid,
                    fiber_name: fiber.name,
                    weight: weight,
                    stock_sort_id: item.stock_sort_id,
                    stock_code: item.stock_code,
                    price_per_kilogram: item.price_per_kilogram,
                    stock_sort_name: item.item_name,
                });

                handleAllocationInputChange(item.tempId, "0");
            }
        });

        if (error) return;

        if (!hasValidAllocation) {
            setError("Harap masukkan berat alokasi minimal 1 item.");
            return;
        }

        allocationsToSubmit.forEach(onAllocate);
        setSelectedFiber("");
        setSelectedItemToAllocate({});
    };

    useEffect(() => {
        if (selectedFiber && usedFiberIds.has(selectedFiber)) {
            setSelectedFiber("");
        }
    }, [fiberAllocations, selectedFiber, usedFiberIds]);

    const groupedNewAllocations = useMemo(() => {
        const groups: {
            [fiberId: string]: {
                fiber_id: string;
                fiber_name: string;
                allocations: FiberAllocation[];
            };
        } = {};

        fiberAllocations.forEach((alloc) => {
            if (!groups[alloc.fiber_id]) {
                groups[alloc.fiber_id] = {
                    fiber_id: alloc.fiber_id,
                    fiber_name: alloc.fiber_name,
                    allocations: [],
                };
            }
            groups[alloc.fiber_id].allocations.push(alloc);
        });

        return Object.values(groups);
    }, [fiberAllocations]);

    if (exportSale) return null;

    const showAddFiberSection = itemsNeedingAllocation.length > 0;

    return (
        <div className="border border-gray-200 p-6 rounded-xl space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-3">
                Fiber
            </h3>
            <p className="text-gray-500 text-sm">
                Pilih fiber yang akan digunakan untuk penjualan
            </p>

            {showAddFiberSection && (
                <div className="border border-gray-300 p-4 rounded-xl space-y-4">
                    <h4 className="text-md font-semibold text-gray-700">
                        Tambah Fiber
                    </h4>

                    <div className="grid grid-cols-1 gap-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fiber
                        </label>
                        <div className="relative">
                            <select
                                value={selectedFiber}
                                onChange={(e) =>
                                    setSelectedFiber(e.target.value)
                                }
                                className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer"
                            >
                                <option value="">Pilih Fiber</option>
                                {availableFibers.map((f) => (
                                    <option key={f.uuid} value={f.uuid}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                size={16}
                            />
                        </div>
                    </div>

                    <h4 className="text-md font-semibold text-gray-700 pt-2">
                        Alokasi Berat per Item
                    </h4>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {!showAddFiberSection &&
                        itemsNeedingAllocation.length === 0 &&
                        selectedItems.length > 0 ? (
                            <p className="text-gray-500 text-sm">
                                Semua item sudah dialokasikan ke fiber
                            </p>
                        ) : itemsNeedingAllocation.length === 0 &&
                          selectedItems.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                Tambahkan item penjualan terlebih dahulu.
                            </p>
                        ) : (
                            itemsNeedingAllocation.map((item) => (
                                <div
                                    key={item.tempId}
                                    className="flex items-end space-x-4 border-b pb-2"
                                >
                                    <div className="w-2/5">
                                        <label className="block text-sm font-bold">
                                            Item {item.item_name}{" "}
                                            <span className="text-xs text-gray-500">
                                                (ID: {item.id})
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            Harga Rp{" "}
                                            {formatRupiah(
                                                item.price_per_kilogram
                                            )}{" "}
                                            /kg
                                        </p>
                                        <p className="text-xs font-semibold text-gray-700">
                                            Berat Sisa: {item.remainingWeight}{" "}
                                            kg
                                        </p>
                                    </div>
                                    <div className="w-3/5">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Alokasi (kg)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={
                                                    selectedItemToAllocate[
                                                        item.tempId
                                                    ] || ""
                                                }
                                                onChange={(e) =>
                                                    handleAllocationInputChange(
                                                        item.tempId,
                                                        e.target.value
                                                    )
                                                }
                                                max={item.remainingWeight}
                                                min="0"
                                                step="0.1"
                                                placeholder="0"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                disabled={!fiber}
                                            />
                                            {selectedItemToAllocate[
                                                item.tempId
                                            ] && (
                                                <X
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
                                                    size={16}
                                                    onClick={() =>
                                                        handleAllocationInputChange(
                                                            item.tempId,
                                                            ""
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex justify-center pt-2">
                        <button
                            type="button"
                            onClick={handleAddAllocation}
                            className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedFiber}
                        >
                            <Plus size={20} />
                            Tambah Fiber
                        </button>
                    </div>
                </div>
            )}

            {selectedItems.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">
                        Tambahkan item penjualan terlebih dahulu untuk
                        mengalokasikan fiber.
                    </p>
                </div>
            )}

            {groupedNewAllocations.length > 0 && (
                <>
                    <h4 className="text-md font-semibold text-gray-700 pt-4">
                        Fiber Terpilih
                    </h4>
                    <p className="text-gray-500 text-sm pb-2">
                        Daftar fiber yang telah dialokasikan
                    </p>

                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Fiber
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Item
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Weight
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Price/Kg
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {groupedNewAllocations.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-gray-500"
                                        >
                                            Belum ada fiber dialokasikan.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {/* Show new fiber allocations (pending save) */}
                                        {groupedNewAllocations.map((group) =>
                                            group.allocations.map(
                                                (alloc, iIndex) => (
                                                    <tr
                                                        key={`new-${group.fiber_id}-${alloc.item_id}-${iIndex}`}
                                                        className="hover:bg-blue-50 bg-blue-50"
                                                    >
                                                        {iIndex === 0 && (
                                                            <td
                                                                rowSpan={
                                                                    group
                                                                        .allocations
                                                                        .length
                                                                }
                                                                className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-middle"
                                                            >
                                                                {
                                                                    group.fiber_name
                                                                }
                                                                <p className="text-xs text-gray-400">
                                                                    ID:{" "}
                                                                    {
                                                                        group.fiber_id
                                                                    }
                                                                </p>
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {
                                                                alloc.stock_sort_name
                                                            }
                                                            <p className="text-xs text-gray-400">
                                                                Stock Code:{" "}
                                                                {
                                                                    alloc.stock_code
                                                                }
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {alloc.weight} kg
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {formatRupiah(
                                                                alloc.price_per_kilogram
                                                            )}
                                                        </td>
                                                        {iIndex === 0 && (
                                                            <td
                                                                rowSpan={
                                                                    group
                                                                        .allocations
                                                                        .length
                                                                }
                                                                className="px-6 py-4 whitespace-nowrap text-right align-middle"
                                                            >
                                                                <button
                                                                    onClick={() =>
                                                                        onRemoveAllocation(
                                                                            alloc.fiber_id
                                                                        )
                                                                    }
                                                                    className="text-red-500 hover:text-red-700 p-1 rounded-full transition"
                                                                    title="Hapus alokasi fiber ini"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                )
                                            )
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default FiberAllocationSectionUpdate;
