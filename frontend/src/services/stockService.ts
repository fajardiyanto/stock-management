import { ApiResponse } from "../types/index";
import { apiCall } from "./authService";
import { StockEntriesFilters, StockEntriesPagination } from "../types/stock";

export const stockService = {
    getStockEntries: async (filters: StockEntriesFilters = {}): Promise<ApiResponse<StockEntriesPagination>> => {
        const queryParams = new URLSearchParams();

        queryParams.append('page', String(filters.page || 1));
        queryParams.append('size', String(filters.size || 10));

        const response = await apiCall<ApiResponse<StockEntriesPagination>>(
            `/stock-entries?${queryParams.toString()}`
        );
        return response;
    },
};