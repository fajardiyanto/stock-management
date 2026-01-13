import { useState, useEffect, useCallback } from "react";
import { analyticService } from "../../services/analyticService";
import { useToast } from "../../contexts/ToastContext";
import {
    SalesSupplierDetailWithPurchasePaginationResponse,
    SalesSupplierDetailFilter,
} from "../../types/analytic";

interface UseSalesSupplierDetailWithPurchaseResult {
    salesSupplier: SalesSupplierDetailWithPurchasePaginationResponse;
    loading: boolean;
    error: string;
    refetch: () => Promise<void>;
}

export const useSalesSupplierDetailWithPurchase = (
    filter: SalesSupplierDetailFilter
): UseSalesSupplierDetailWithPurchaseResult => {
    const [salesSupplier, setSalesSupplier] =
        useState<SalesSupplierDetailWithPurchasePaginationResponse>(
            {} as SalesSupplierDetailWithPurchasePaginationResponse
        );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast } = useToast();

    const fetchSalesSupplierDetailWithPurchase = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response =
                await analyticService.getSalesSupplierDetailWithPurchase(
                    filter
                );

            if (response.status_code === 200) {
                setSalesSupplier(response.data);
            } else {
                setError(
                    response.message || "Failed to fetch daily dashboard stats"
                );
                showToast(
                    response.message || "Failed to fetch daily dashboard stats",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch daily dashboard stats. Please try again");
            showToast(
                "Failed to fetch daily dashboard stats. Please try again",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSalesSupplierDetailWithPurchase();
    }, [fetchSalesSupplierDetailWithPurchase]);

    return {
        salesSupplier,
        loading,
        error,
        refetch: fetchSalesSupplierDetailWithPurchase,
    };
};
