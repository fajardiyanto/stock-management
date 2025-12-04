import React, { useEffect, useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import SaleInfoSection from "../components/SalesComponents/SaleInfoSection";
import ItemSelectionSection from "../components/SalesComponents/ItemSelectionSection";
import FiberAllocationSection from "../components/SalesComponents/FiberAllocationSection";
import AddOnSection from "../components/SalesComponents/AddOnSection";
import SaleSummaryCard from "../components/SalesComponents/SaleSummaryCard";
import {
    SubmitSaleRequest,
    SelectedSaleItem,
    FiberAllocation,
    SelectedAddOn,
    BuyerOption,
} from "../types/sales";
import { FiberList } from "../types/fiber";
import { getDefaultDate } from "../utils/DefaultDate";
import { useToast } from "../contexts/ToastContext";
import { authService } from "../services/authService";
import { stockService } from "../services/stockService";
import { fiberService } from "../services/fiberService";
import { salesService } from "../services/salesService";
import { StockSortResponse } from "../types/stock";
import { useNavigate } from "react-router-dom";

const SaleCreationPage: React.FC = () => {
    const [formData, setFormData] = useState<SubmitSaleRequest>({
        customer_id: "",
        sales_date: getDefaultDate(),
        export_sale: false,
        sale_items: [],
        add_ons: [],
        fiber_allocations: [],
        total_amount: 0,
    });

    const [selectedItems, setSelectedItems] = useState<SelectedSaleItem[]>([]);
    const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [buyerList, setBuyerList] = useState<BuyerOption[]>([]);
    const [stockSorts, setStockSorts] = useState<StockSortResponse[]>([]);
    const [fibers, setFibers] = useState<FiberList[]>([]);

    const { showToast } = useToast();
    const navigate = useNavigate();

    const totalItemPrice = selectedItems.reduce(
        (sum, item) => sum + item.total_amount,
        0
    );
    const totalAddonPrice = selectedAddOns.reduce(
        (sum, addon) => sum + addon.total_price,
        0
    );
    const totalFiberPrice = 0;
    const grandTotal = totalItemPrice + totalAddonPrice + totalFiberPrice;

    const handleFormChange = (
        field: keyof SubmitSaleRequest,
        value: string | boolean
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (field === "export_sale" && value === true) {
            setFormData((prev) => ({ ...prev, fiber_allocations: [] }));
        }
    };

    const handleItemAdd = (item: SelectedSaleItem) => {
        setSelectedItems((prev) => [...prev, item]);
        setError("");
    };

    const handleItemRemove = (tempId: string) => {
        setSelectedItems((prev) =>
            prev.filter((item) => item.tempId !== tempId)
        );
        setFormData((prev) => ({
            ...prev,
            fiber_allocations: prev.fiber_allocations.filter(
                (alloc) => alloc.item_id !== tempId
            ),
        }));
        setError("");
    };

    const handleAddOnAdd = (addon: SelectedAddOn) => {
        setSelectedAddOns((prev) => [...prev, addon]);
        setError("");
    };

    const handleAddOnRemove = (tempId: string) => {
        setSelectedAddOns((prev) =>
            prev.filter((addon) => addon.tempId !== tempId)
        );
        setError("");
    };

    const handleFiberAllocation = (allocation: FiberAllocation) => {
        setFormData((prev) => ({
            ...prev,
            fiber_allocations: [...prev.fiber_allocations, allocation],
        }));
        setError("");
    };

    const handleRemoveAllocation = (fiberUuid: string) => {
        setFormData((prev) => ({
            ...prev,
            fiber_allocations: prev.fiber_allocations.filter(
                (alloc) => alloc.fiber_id !== fiberUuid
            ),
        }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.customer_id) {
            setError("Harap pilih Pembeli.");
            return;
        }
        if (selectedItems.length === 0) {
            setError("Harap tambahkan minimal satu Item Penjualan.");
            return;
        }

        setIsSubmitting(true);

        const submissionPayload: SubmitSaleRequest = {
            ...formData,
            sales_date: formData.sales_date + ":00Z",
            sale_items: selectedItems.map((item) => ({
                stock_sort_id: item.stock_sort_id,
                weight: item.weight,
                stock_code: item.stock_code,
                price_per_kilogram: item.price_per_kilogram,
                total_amount: item.total_amount,
            })),
            add_ons: selectedAddOns.map((addon) => ({
                name: addon.name,
                price: addon.price,
            })),
            total_amount: grandTotal,
        };

        try {
            const response = await salesService.createSales(submissionPayload);
            if (response.status_code === 201 || response.status_code === 200) {
                showToast("Sales berhasil disimpan!", "success");
                navigate("/dashboard/sales");
            } else {
                const errorMessage =
                    response.message || "Gagal menyimpan penjualan. Coba lagi.";
                setError(errorMessage);
                showToast(errorMessage, "error");
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Gagal menyimpan hasil penjualan. Coba lagi.";
            setError(errorMessage);
            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchBuyerOptions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authService.getListUserRoles("buyer");
            if (response.status_code === 200) {
                const defaultBuyer: any = { uuid: "", name: "Semua Buyer" };
                setBuyerList([defaultBuyer, ...response.data]);
            } else {
                setError(response.message || "Failed to fetch buyer data");
                showToast(
                    response.message || "Failed to fetch buyer data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch buyer data. Please try again");
            showToast("Failed to fetch buyer data. Please try again", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchStockSorts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await stockService.getAllStockSorts();
            if (response.status_code === 200) {
                setStockSorts(response.data);
            } else {
                setError(
                    response.message || "Failed to fetch stock sorts data"
                );
                showToast(
                    response.message || "Failed to fetch stock sorts data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch stock sorts data. Please try again");
            showToast(
                "Failed to fetch stock sorts data. Please try again",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchFiberList = useCallback(async () => {
        setLoading(true);

        try {
            const response = await fiberService.getAllUsedFiber();
            if (response.status_code === 200) {
                if (response.data) {
                    const fiberOptions = response.data.map((fiber) => ({
                        uuid: fiber.uuid,
                        name: fiber.name,
                    }));
                    setFibers(fiberOptions);
                }
            } else {
                setError(response.message || "Failed to fetch fiber data");
                showToast(
                    response.message || "Failed to fetch fiber data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch fiber data. Please try again");
            showToast("Failed to fetch fiber data. Please try again", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchBuyerOptions();
        fetchStockSorts();
        fetchFiberList();
    }, [fetchBuyerOptions, fetchStockSorts, fetchFiberList]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-10 font-sans">
            <header className="mb-8">
                <button
                    onClick={() => navigate("/dashboard/sales")}
                    className="flex items-center text-gray-600 hover:text-gray-800 transition mb-4 font-medium"
                >
                    <ArrowLeft size={18} className="mr-2" />
                    Kembali
                </button>
                <h1 className="text-3xl font-extrabold text-gray-900">
                    Form Penjualan
                </h1>
                <p className="text-gray-500 mt-1">
                    Isi form untuk membuat penjualan baru
                </p>
            </header>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                                {error}
                            </div>
                        )}

                        <SaleInfoSection
                            formData={formData}
                            onFormChange={handleFormChange}
                            buyerList={buyerList}
                        />

                        <ItemSelectionSection
                            selectedItems={selectedItems}
                            itemSortirOptions={stockSorts}
                            onAddItem={handleItemAdd}
                            onRemoveItem={handleItemRemove}
                        />

                        <FiberAllocationSection
                            selectedItems={selectedItems}
                            fiberAllocations={formData.fiber_allocations}
                            fiberList={fibers}
                            exportSale={formData.export_sale}
                            onAllocate={handleFiberAllocation}
                            onRemoveAllocation={handleRemoveAllocation}
                        />

                        <AddOnSection
                            selectedAddOns={selectedAddOns}
                            onAddAddOn={handleAddOnAdd}
                            onRemoveAddOn={handleAddOnRemove}
                        />
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <SaleSummaryCard
                            totalItem={totalItemPrice}
                            totalAddon={totalAddonPrice}
                            totalFiber={totalFiberPrice}
                            total={grandTotal}
                        />

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-800 transition shadow-lg disabled:opacity-50"
                                disabled={
                                    isSubmitting ||
                                    !formData.customer_id ||
                                    selectedItems.length === 0 ||
                                    loading
                                }
                            >
                                {isSubmitting
                                    ? "Memproses..."
                                    : "Simpan Penjualan"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SaleCreationPage;
