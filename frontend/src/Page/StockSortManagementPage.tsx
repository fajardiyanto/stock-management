import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import StockSortInfoCard from "../components/StockComponents/StockSortInfoCard";
import StockSortTotalsSummary from "../components/StockComponents/StockSortTotalsSummary";
import StockSortResultInput from "../components/StockComponents/StockSortResultInput";
import {
    StockSortInfoCardResponse,
    SubmitSortRequest,
    StockSortRequest,
} from "../types/stock";
import { useNavigate, useParams } from "react-router-dom";
import { stockService } from "../services/stockService";
import { useToast } from "../contexts/ToastContext";

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
};

const createNewEmptySortResult = (): StockSortRequest => ({
    uuid: Math.random().toString(16).slice(2),
    sorted_item_name: "",
    weight: 0,
    price_per_kilogram: 0,
    current_weight: 0,
    is_shrinkage: false,
});

const StockSortManagementPage: React.FC = () => {
    const [stockInfo, setStockInfo] =
        useState<StockSortInfoCardResponse | null>(null);
    const [formData, setFormData] = useState<StockSortRequest[]>([
        createNewEmptySortResult(),
    ]);
    const [error, setError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);

    const { showToast } = useToast();
    const navigate = useNavigate();
    const { stockItemId } = useParams<{ stockItemId: string }>();

    const currentFormWeight = formData.reduce(
        (sum, result) => sum + (result.weight || 0),
        0
    );

    const totalOriginalWeight = stockInfo?.stock_item?.weight || 0;
    const weightAlreadySorted = isEditMode
        ? 0
        : stockInfo?.stock_item?.already_sortir || 0;
    const remainingWeight =
        totalOriginalWeight - weightAlreadySorted - currentFormWeight;

    const fetchStockItem = useCallback(async () => {
        if (!stockItemId) {
            setLoading(false);
            setError("Stock Item ID is missing.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await stockService.getStockItemById(stockItemId);

            if (response.status_code === 200 && response.data) {
                const fetchedData = response.data;
                setStockInfo(fetchedData);

                const existingSorts = fetchedData.stock_item?.stock_sorts;

                if (existingSorts && existingSorts.length > 0) {
                    setIsEditMode(true);
                    setFormData(
                        existingSorts.map((s) => ({
                            uuid: s.uuid || Math.random().toString(16).slice(2),
                            sorted_item_name: s.sorted_item_name || "",
                            weight: s.weight || 0,
                            price_per_kilogram: s.price_per_kilogram || 0,
                            current_weight: s.current_weight || 0,
                            is_shrinkage: s.is_shrinkage || false,
                        }))
                    );
                    showToast(
                        "Mode Edit: Anda dapat menambah/menghapus hasil sortir",
                        "info"
                    );
                } else {
                    setIsEditMode(false);
                    setFormData([createNewEmptySortResult()]);
                }
            } else {
                setError(response.message || "Failed to fetch stock item data");
                showToast(
                    response.message || "Failed to fetch stock item data",
                    "error"
                );
            }
        } catch (err) {
            console.error("Error fetching stock item:", err);
            setError("Failed to fetch stock item. Please try again");
            showToast("Failed to fetch stock item. Please try again", "error");
        } finally {
            setLoading(false);
        }
    }, [stockItemId, showToast]);

    useEffect(() => {
        fetchStockItem();
    }, [fetchStockItem]);

    const handleResultChange = (
        index: number,
        field: keyof StockSortRequest,
        value: string | number | boolean
    ) => {
        const newResults = [...formData];
        let updatedResult = { ...newResults[index], [field]: value };

        if (field === "is_shrinkage") {
            if (value === true) {
                updatedResult.sorted_item_name = "susut";
                updatedResult.price_per_kilogram = 0;
            } else if (updatedResult.sorted_item_name === "susut") {
                updatedResult.sorted_item_name = "";
            }
        }

        newResults[index] = updatedResult;
        setFormData(newResults);
        setError("");
    };

    const handleAddResult = () => {
        if (!isEditMode && remainingWeight <= 0) {
            setError("Tidak ada sisa berat untuk disortir.");
            showToast("Tidak ada sisa berat untuk disortir.", "warning");
            return;
        }

        setFormData((prev) => [...prev, createNewEmptySortResult()]);
        showToast("Form sortir baru ditambahkan", "success");
    };

    const handleRemoveResult = (uuidToRemove: string) => {
        if (formData.length <= 1) {
            showToast("Minimal harus ada satu hasil sortir", "warning");
            return;
        }
        setFormData((prev) =>
            prev.filter((result) => result.uuid !== uuidToRemove)
        );
        setError("");
    };

    const handleReset = () => {
        if (
            stockInfo?.stock_item?.stock_sorts &&
            stockInfo.stock_item.stock_sorts.length > 0
        ) {
            setFormData(
                stockInfo.stock_item.stock_sorts.map((s) => ({
                    uuid: s.uuid || Math.random().toString(16).slice(2),
                    sorted_item_name: s.sorted_item_name || "", // FIXED
                    weight: s.weight || 0,
                    price_per_kilogram: s.price_per_kilogram || 0,
                    current_weight: s.current_weight || 0,
                    is_shrinkage: s.is_shrinkage || false,
                }))
            );
        } else {
            setFormData([createNewEmptySortResult()]);
        }
        setError("");
        showToast("Form berhasil di-reset", "info");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (isSubmitting || !stockItemId) return;

        const validResults = formData.filter(
            (r) =>
                r.weight > 0 &&
                (r.is_shrinkage || r.sorted_item_name.trim() !== "")
        );

        if (validResults.length === 0) {
            setError(
                "Harap masukkan minimal satu hasil sortir yang valid (ada nama dan berat)."
            );
            showToast(
                "Harap masukkan minimal satu hasil sortir yang valid",
                "warning"
            );
            return;
        }

        const totalWeight = validResults.reduce((sum, r) => sum + r.weight, 0);
        if (totalWeight > totalOriginalWeight) {
            setError("Total berat sortir melebihi berat item asli!");
            showToast("Total berat sortir melebihi berat item asli!", "error");
            return;
        }

        if (!isEditMode && remainingWeight < 0) {
            setError(
                "Total berat yang disortir melebihi sisa berat yang tersedia!"
            );
            showToast(
                "Total berat yang disortir melebihi sisa berat yang tersedia!",
                "error"
            );
            return;
        }

        setIsSubmitting(true);

        const finalPayload: SubmitSortRequest = {
            stock_item_uuid: stockItemId,
            stock_sort_request: validResults.map((form) => ({
                sorted_item_name: form.sorted_item_name,
                weight: form.weight,
                price_per_kilogram: form.price_per_kilogram,
                current_weight: form.current_weight,
                is_shrinkage: form.is_shrinkage,
            })),
        };

        try {
            const response = isEditMode
                ? await stockService.updateStockSort(stockItemId, finalPayload)
                : await stockService.createStockSort(finalPayload);

            if (response.status_code === 200) {
                showToast(
                    isEditMode
                        ? "Hasil sortir berhasil diperbarui!"
                        : "Hasil sortir berhasil disimpan!",
                    "success"
                );

                await fetchStockItem();
            } else {
                showToast(
                    response.message || "Failed to submit sort results",
                    "error"
                );
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Gagal menyimpan hasil sortir. Coba lagi.";
            setError(errorMessage);
            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !stockInfo) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">
                    Loading Stock Item Details...
                </div>
            </div>
        );
    }

    const canRemove = formData.length > 1 && !isSubmitting;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-10 font-sans">
            <header className="mb-8">
                <button
                    onClick={() => navigate("/dashboard/stock")}
                    className="flex items-center text-gray-600 hover:text-gray-800 transition mb-4 font-medium w-fit"
                >
                    <ArrowLeft size={18} className="mr-2" />
                    Kembali
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            Kelola Sortir
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Kelola Sortir dan Item Stok:{" "}
                            {stockInfo.stock_item?.item_name}
                        </p>
                    </div>
                    {isEditMode && (
                        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg">
                            <span className="font-semibold">Mode Edit</span>
                            <p className="text-xs mt-1">
                                Anda dapat menambah/menghapus hasil sortir
                            </p>
                        </div>
                    )}
                </div>
            </header>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-2xl p-6 lg:p-8 space-y-8"
            >
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}

                <StockSortInfoCard
                    info={stockInfo}
                    formatRupiah={formatRupiah}
                />

                <section>
                    <div className="flex justify-between items-center border-b pb-3 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Hasil Sortir
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddResult}
                            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting || remainingWeight <= 0}
                        >
                            <Plus size={18} /> Tambah Sortir
                        </button>
                    </div>

                    <div className="mb-8">
                        <StockSortTotalsSummary
                            totalSortedWeight={currentFormWeight}
                            remainingWeight={remainingWeight}
                        />
                    </div>

                    <div className="space-y-6">
                        {formData.map((result, index) => (
                            <StockSortResultInput
                                key={result.uuid}
                                index={index}
                                result={result}
                                onChange={handleResultChange}
                                onRemove={handleRemoveResult}
                                canRemove={canRemove}
                            />
                        ))}
                    </div>
                </section>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-800 transition shadow-lg disabled:opacity-50 flex items-center"
                        disabled={
                            isSubmitting || (!isEditMode && remainingWeight < 0)
                        }
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                {isEditMode ? "Memperbarui..." : "Menyimpan..."}
                            </>
                        ) : isEditMode ? (
                            "Perbarui Hasil Sortir"
                        ) : (
                            "Simpan Hasil Sortir"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StockSortManagementPage;
