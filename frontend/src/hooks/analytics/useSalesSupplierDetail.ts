import { useState, useEffect, useCallback } from "react";
import { analyticService } from "../../services/analyticService";
import { useToast } from "../../contexts/ToastContext";
import {
    SalesSupplierDetailPaginationResponse,
    SalesSupplierDetailFilter,
} from "../../types/analytic";

interface UseSalesSupplierDetailResult {
    salesSupplier: SalesSupplierDetailPaginationResponse;
    loading: boolean;
    error: string;
    refetch: () => Promise<void>;
}

export const useSalesSupplierDetail = (
    filter: SalesSupplierDetailFilter
): UseSalesSupplierDetailResult => {
    const [salesSupplier, setSalesSupplier] =
        useState<SalesSupplierDetailPaginationResponse>(
            {} as SalesSupplierDetailPaginationResponse
        );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast } = useToast();

    const fetchSalesSupplierDetail = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getSalesSupplierDetail(
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
    }, [filter, showToast]);

    useEffect(() => {
        fetchSalesSupplierDetail();
    }, [fetchSalesSupplierDetail]);

    return {
        salesSupplier,
        loading,
        error,
        refetch: fetchSalesSupplierDetail,
    };
};
