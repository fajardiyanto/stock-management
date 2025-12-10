import { useState, useEffect, useCallback } from 'react';
import { analyticService } from '../../services/analyticService';
import { useToast } from '../../contexts/ToastContext';
import { StockDistributionData } from "../../types/analytic";

interface UseStockDistributionDataResult {
    stockDistributionData: StockDistributionData[];
    loading: boolean;
    error: string;
    refetch: () => Promise<void>;
}

export const useStockDistributionData = (): UseStockDistributionDataResult => {
    const [stockDistributionData, setStockDistributionData] = useState<
        StockDistributionData[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast } = useToast();

    const fetchStockDistributionData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getStockDistributionData();

            if (response.status_code === 200) {
                setStockDistributionData(response.data);
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
        fetchStockDistributionData();
    }, [fetchStockDistributionData]);

    return {
        stockDistributionData,
        loading,
        error,
        refetch: fetchStockDistributionData,
    };
};
