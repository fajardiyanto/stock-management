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
    fiberItemAllocations?: FiberItemAllocationResponse[]; // New prop for existing allocations
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

    // Get used fibers from both sources
    const usedFiberIds = useMemo(() => {
        const fromAllocations = new Set(
            fiberAllocations.map((alloc) => alloc.fiber_id)
        );

        const fromItemAllocations = new Set(
            fiberItemAllocations.map((item) => item.fiber_id)
        );

        return new Set<string>([
            ...Array.from(fromAllocations),
            ...Array.from(fromItemAllocations),
        ]);
    }, [fiberAllocations, fiberItemAllocations]);

    const availableFibers = fiberList.filter(
        (fiber) => !usedFiberIds.has(fiber.uuid)
    );

    // Calculate items needing allocation considering fiber_groups data
    const itemsNeedingAllocation = selectedItems
        .map((item) => {
            // Get allocated weight from both fiberAllocations and fiberItemAllocations

            const allocatedFromExisting = fiberItemAllocations
                .filter((fiberItem) => fiberItem.id === item.tempId)
                .reduce((sum, fiberItem) => sum + fiberItem.weight, 0);

            const totalAllocated = allocatedFromExisting;
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
        let totalWeightAllocated = 0;
        let totalRequiredWeight = 0;

        itemsNeedingAllocation.forEach((item) => {
            const weight = parseFloat(selectedItemToAllocate[item.tempId]) || 0;
            totalRequiredWeight += item.weight;

            if (weight > 0) {
                if (weight > item.weight) {
                    setError(
                        `Alokasi berat untuk ${item.item_name} (${weight} kg) melebihi berat jual (${item.weight} kg).`
                    );
                    return;
                }

                allocationsToSubmit.push({
                    item_id: item.tempId,
                    fiber_id: fiber.uuid,
                    fiber_name: fiber.name,
                    weight: weight,
                    stock_sort_id: item.stock_sort_id,
                });

                totalWeightAllocated += weight;
                handleAllocationInputChange(item.tempId, "0");
            }
        });

        if (error) return;

        if (allocationsToSubmit.length === 0) {
            setError("Harap masukkan berat alokasi minimal 1 item.");
            return;
        }

        allocationsToSubmit.forEach(onAllocate);

        if (totalWeightAllocated === totalRequiredWeight) {
            setSelectedFiber("");
            setSelectedItemToAllocate({});
        }
    };

    useEffect(() => {
        if (selectedFiber && usedFiberIds.has(selectedFiber)) {
            setSelectedFiber("");
        }
    }, [fiberAllocations, selectedFiber, usedFiberIds]);

    // Group existing fiber allocations by fiber for display
    const groupedFiberAllocations = useMemo(() => {
        const groups: {
            [fiberId: string]: {
                fiber_id: string;
                fiber_name: string;
                items: FiberItemAllocationResponse[];
            };
        } = {};

        fiberItemAllocations.forEach((item) => {
            if (!groups[item.fiber_id]) {
                groups[item.fiber_id] = {
                    fiber_id: item.fiber_id,
                    fiber_name: item.fiber_name,
                    items: [],
                };
            }
            groups[item.fiber_id].items.push(item);
        });

        return Object.values(groups);
    }, [fiberItemAllocations]);

    if (exportSale) return null;

    return (
        <div className="border border-gray-200 p-6 rounded-xl space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-3">
                Fiber
            </h3>
            <p className="text-gray-500 text-sm">
                Pilih fiber yang akan digunakan untuk penjualan
            </p>

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
                            onChange={(e) => setSelectedFiber(e.target.value)}
                            className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer"
                            disabled={itemsNeedingAllocation.length === 0}
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
                    {itemsNeedingAllocation.length === 0 &&
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
                                        {formatRupiah(item.price_per_kilogram)}{" "}
                                        /kg
                                    </p>
                                    <p className="text-xs font-semibold text-gray-700">
                                        Berat Sisa: {item.remainingWeight} kg
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
                                            max={item.weight}
                                            min="0"
                                            placeholder="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            title="Clear allocation"
                                            disabled={!fiber}
                                        />
                                        <X
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                                            size={16}
                                            onClick={() =>
                                                handleAllocationInputChange(
                                                    item.tempId,
                                                    "0"
                                                )
                                            }
                                        />
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
                        className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50"
                        disabled={
                            !selectedFiber ||
                            itemsNeedingAllocation.length === 0
                        }
                    >
                        <Plus size={20} />
                        Tambah Fiber
                    </button>
                </div>
            </div>

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
                        {groupedFiberAllocations.length === 0 &&
                        fiberAllocations.length === 0 ? (
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
                                {/* Show existing fiber allocations from fiber_groups */}
                                {groupedFiberAllocations.map((group, gIndex) =>
                                    group.items.map((item, iIndex) => (
                                        <tr
                                            key={`existing-${group.fiber_id}-${item.id}-${iIndex}`}
                                            className="hover:bg-gray-50"
                                        >
                                            {iIndex === 0 && (
                                                <td
                                                    rowSpan={group.items.length}
                                                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-middle"
                                                >
                                                    {group.fiber_name}
                                                    <p className="text-xs text-gray-400">
                                                        ID: {group.fiber_id}
                                                    </p>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {item.stock_sort_name}
                                                <p className="text-xs text-gray-400">
                                                    Stock Code:{" "}
                                                    {item.stock_code}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {item.weight} kg
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {formatRupiah(
                                                    item.price_per_kilogram
                                                )}
                                            </td>
                                            {iIndex === 0 && (
                                                <td
                                                    rowSpan={group.items.length}
                                                    className="px-6 py-4 whitespace-nowrap text-right align-middle"
                                                >
                                                    <button
                                                        onClick={() =>
                                                            onRemoveAllocation(
                                                                group.fiber_id
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 p-1 rounded-full transition"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FiberAllocationSectionUpdate;
