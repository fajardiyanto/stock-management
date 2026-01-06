import { useState, useEffect, useCallback } from "react";
import { analyticService } from "../../services/analyticService";
import { useToast } from "../../contexts/ToastContext";
import { SalesTrendData } from "../../types/analytic";

interface UseSalesTrendDataResult {
    salesTrendData: SalesTrendData[];
    loading: boolean;
    error: string;
    refetch: () => Promise<void>;
}

export const useSalesTrendData = (date: string): UseSalesTrendDataResult => {
    const [salesTrendData, setSalesTrendData] = useState<SalesTrendData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast } = useToast();

    const fetchSalesTrendData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getSalesTrendData(date);

            if (response.status_code === 200) {
                setSalesTrendData(response.data);
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
    }, [date, showToast]);

    useEffect(() => {
        if (!date) return;
        fetchSalesTrendData();
    }, [date, fetchSalesTrendData]);

    return {
        salesTrendData,
        loading,
        error,
        refetch: fetchSalesTrendData,
    };
};
