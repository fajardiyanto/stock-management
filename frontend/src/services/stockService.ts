import { ApiResponse } from "../types/index";
import { apiCall } from "./";
import {
    StockEntriesFilters,
    StockEntriesPagination,
    StockEntry,
    StockSortInfoCardResponse,
    SubmitSortRequest,
    StockSortResponse,
} from "../types/stock";
import { CreatePurchasingRequest, Purchasing } from "../types/purchase";

export const stockService = {
    getStockEntries: async (
        filters: StockEntriesFilters = {}
    ): Promise<ApiResponse<StockEntriesPagination>> => {
        const queryParams = new URLSearchParams();

        queryParams.append("page", String(filters.page || 1));
        queryParams.append("size", String(filters.size || 10));

        if (filters.supplier_id) {
            queryParams.append("supplier_id", filters.supplier_id);
        }
        if (filters.purchase_date) {
            queryParams.append("purchase_date", filters.purchase_date);
        }
        if (filters.age_in_day && filters.age_in_day !== "0") {
            queryParams.append("age_in_day", filters.age_in_day);
        }
        if (filters.keyword) {
            queryParams.append("keyword", filters.keyword);
        }

        const response = await apiCall<ApiResponse<StockEntriesPagination>>(
            `/stocks?${queryParams.toString()}`
        );
        return response;
    },

    getStockEntryById: async (id: string): Promise<ApiResponse<StockEntry>> => {
        const response = await apiCall<ApiResponse<StockEntry>>(
            `/stocks/${id}`
        );
        return response;
    },

    updateStockEntry: async (
        stockId: string,
        data: CreatePurchasingRequest
    ): Promise<ApiResponse<Purchasing>> => {
        const response = await apiCall<ApiResponse<Purchasing>>(
            `/stocks/${stockId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );
        return response;
    },

    getStockItemById: async (
        stockItemId: string
    ): Promise<ApiResponse<StockSortInfoCardResponse>> => {
        const response = await apiCall<ApiResponse<StockSortInfoCardResponse>>(
            `/stocks/items/${stockItemId}`
        );
        return response;
    },

    createStockSort: async (
        data: SubmitSortRequest
    ): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/stocks/sorts/${data.stock_item_uuid}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );
        return response;
    },

    updateStockSort: async (
        stockItemId: string,
        data: SubmitSortRequest
    ): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/stocks/sorts/${stockItemId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );
        return response;
    },

    deleteStock: async (stockId: string): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(`/stocks/${stockId}`, {
            method: "DELETE",
        });

        return response;
    },

    getAllStockSorts: async (): Promise<ApiResponse<StockSortResponse[]>> => {
        const response = await apiCall<ApiResponse<StockSortResponse[]>>(
            `/stocks/sorts`
        );
        return response;
    },
};
