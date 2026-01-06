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
    SaleEntry, // Use SaleEntry for fetched data
} from "../types/sales";
import { FiberList } from "../types/fiber";
import { getDefaultDate } from "../utils/DefaultDate";
import { useToast } from "../contexts/ToastContext";
import { authService } from "../services/authService";
import { stockService } from "../services/stockService";
import { fiberService } from "../services/fiberService";
import { salesService } from "../services/salesService";
import { StockSortResponse } from "../types/stock";
import { useNavigate, useParams } from "react-router-dom";

const mapApiToFormState = (
    saleEntry: SaleEntry
): {
    formData: SubmitSaleRequest;
    selectedItems: SelectedSaleItem[];
    selectedAddOns: SelectedAddOn[];
} => {
    const selectedItems: SelectedSaleItem[] = saleEntry.sold_items.map(
        (item, index) => ({
            tempId: `temp-${index}-${Math.random()}`,
            id: 0,
            stock_sort_id: item.stock_sort_id,
            stock_code: item.stock_code,
            item_name: item.stock_sort_name,
            weight: item.weight,
            price_per_kilogram: item.price_per_kilogram,
            total_amount: item.total_amount,
        })
    );

    const selectedAddOns: SelectedAddOn[] = saleEntry.add_ons.map(
        (addon, index) => ({
            tempId: `addon-${index}-${Math.random()}`,
            name: addon.addon_name,
            price: addon.addon_price,
            total_price: addon.addon_price,
        })
    );

    const fiberAllocations: FiberAllocation[] = saleEntry.fiber_used.map(
        (fiber) => ({
            item_id: fiber.uuid,
            fiber_id: fiber.uuid,
            fiber_name: fiber.name,
            weight: 0,
        })
    );

    const formData: SubmitSaleRequest = {
        customer_id: saleEntry.customer.uuid,
        sales_date: saleEntry.sales_date.slice(0, 16),
        export_sale: saleEntry.export_sale,
        total_amount: saleEntry.total_amount,

        sale_items: [],
        add_ons: [],
        fiber_allocations: fiberAllocations,
    };

    return { formData, selectedItems, selectedAddOns };
};

const SaleUpdatePage: React.FC = () => {
    const { saleId } = useParams<{ saleId: string }>();
    const [originalSale, setOriginalSale] = useState<SaleEntry | null>(null);

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
    const [loading, setLoading] = useState<boolean>(true);
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

    const fetchResources = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const buyersPromise = authService.getListUserRoles("buyer");

            const stockSortsPromise = stockService.getAllStockSorts();

            const fibersPromise = fiberService.getAllUsedFiber();

            const [buyersResponse, stockSortsResponse, fibersResponse] =
                await Promise.all([
                    buyersPromise,
                    stockSortsPromise,
                    fibersPromise,
                ]);

            if (buyersResponse.status_code === 200 && buyersResponse.data) {
                const defaultBuyer: BuyerOption = {
                    uuid: "",
                    name: "Pilih pembeli...",
                };
                setBuyerList([defaultBuyer, ...buyersResponse.data]);
            } else {
                showToast(
                    buyersResponse.message || "Gagal memuat daftar pembeli.",
                    "error"
                );
            }

            if (
                stockSortsResponse.status_code === 200 &&
                stockSortsResponse.data
            ) {
                setStockSorts(stockSortsResponse.data);
            } else {
                showToast(
                    stockSortsResponse.message || "Gagal memuat item stok.",
                    "error"
                );
            }

            if (fibersResponse.status_code === 200 && fibersResponse.data) {
                setFibers(fibersResponse.data);
            }
        } catch (err) {
            setError("Gagal memuat sumber daya awal. Coba lagi.");
            showToast("Gagal memuat sumber daya awal. Coba lagi.", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchSaleData = useCallback(async () => {
        if (!saleId) return;
        setLoading(true);
        setError("");

        try {
            const response = await salesService.getSaleById(saleId);

            if (response.status_code === 200 && response.data) {
                const saleEntry = response.data;

                if (!saleEntry) {
                    setError("Sale entry data is empty.");
                    return;
                }

                setOriginalSale(saleEntry);

                const {
                    formData: newFormData,
                    selectedItems: newSelectedItems,
                    selectedAddOns: newSelectedAddOns,
                } = mapApiToFormState(saleEntry);

                setFormData(newFormData);
                setSelectedItems(newSelectedItems);
                setSelectedAddOns(newSelectedAddOns);
            } else {
                setError(response.message || "Failed to fetch sale data");
                showToast(
                    response.message || "Failed to fetch sale data",
                    "error"
                );
            }
        } catch (err) {
            setError("Gagal memuat data penjualan. Please try again.");
            showToast(
                "Gagal memuat data penjualan. Please try again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [saleId, showToast]);

    useEffect(() => {
        fetchResources();
        if (saleId) {
            fetchSaleData();
        }
    }, [fetchResources, fetchSaleData, saleId]);

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

        if (!saleId) {
            console.error("Sale ID is missing for update.");
            return;
        }

        if (selectedItems.length === 0) {
            setError("Harap tambahkan minimal satu Item Penjualan.");
            showToast(
                "Harap tambahkan minimal satu Item Penjualan.",
                "warning"
            );
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
            const response = await salesService.updateSales(
                saleId,
                submissionPayload
            );

            if (response.status_code === 200) {
                showToast("Penjualan berhasil diperbarui!", "success");
                navigate("/dashboard/sales");
            } else {
                const errorMessage =
                    response.message ||
                    "Gagal memperbarui penjualan. Coba lagi.";
                setError(errorMessage);
                showToast(errorMessage, "error");
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Gagal memperbarui penjualan. Coba lagi.";
            setError(errorMessage);
            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !originalSale) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Memuat data penjualan...</div>
            </div>
        );
    }

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
                    Edit Penjualan: {originalSale?.sale_code || "Loading..."}
                </h1>
                <p className="text-gray-500 mt-1">
                    Perbarui informasi penjualan ikan ke pembeli
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
                                    : "Perbarui Penjualan"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SaleUpdatePage;
