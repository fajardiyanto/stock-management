import { ApiResponse } from "../types";
import { apiCall } from "./";
import {
    DashboardStats,
    DailyDashboardStats,
    SalesTrendData,
    StockDistributionData,
    UserData,
    SalesSupplierDetailPaginationResponse,
    SalesSupplierDetailFilter,
    SalesSupplierDetailWithPurchasePaginationResponse,
} from "../types/analytic";

export const analyticService = {
    getDashboardStats: async (
        year: string,
        month: string
    ): Promise<ApiResponse<DashboardStats>> => {
        const response = await apiCall<ApiResponse<DashboardStats>>(
            `/analytics/stats/${month}/${year}`
        );
        return response;
    },

    getDailyDashboardStats: async (
        date: string
    ): Promise<ApiResponse<DailyDashboardStats>> => {
        const response = await apiCall<ApiResponse<DailyDashboardStats>>(
            `/analytics/daily/${date}/stats`
        );
        return response;
    },

    getSalesTrendData: async (
        year: string
    ): Promise<ApiResponse<SalesTrendData[]>> => {
        const response = await apiCall<ApiResponse<SalesTrendData[]>>(
            `/analytics/sales/trend/${year}`
        );
        return response;
    },

    getStockDistributionData: async (): Promise<
        ApiResponse<StockDistributionData[]>
    > => {
        const response = await apiCall<ApiResponse<StockDistributionData[]>>(
            `/analytics/stock/distribution`
        );
        return response;
    },

    getSupplierPerformance: async (): Promise<ApiResponse<UserData[]>> => {
        const response = await apiCall<ApiResponse<UserData[]>>(
            `/analytics/supplier/performance`
        );
        return response;
    },

    getCustomerPerformance: async (): Promise<ApiResponse<UserData[]>> => {
        const response = await apiCall<ApiResponse<UserData[]>>(
            `/analytics/customer/performance`
        );
        return response;
    },

    getSalesSupplierDetail: async (
        filters: SalesSupplierDetailFilter
    ): Promise<ApiResponse<SalesSupplierDetailPaginationResponse>> => {
        const queryParams = new URLSearchParams();

        queryParams.append("page_no", String(filters.page_no || 1));
        queryParams.append("size", String(filters.size || 10));

        const response = await apiCall<
            ApiResponse<SalesSupplierDetailPaginationResponse>
        >(`/analytics/sales/supplier?${queryParams.toString()}`);
        return response;
    },

    getSalesSupplierDetailWithPurchase: async (
        filters: SalesSupplierDetailFilter
    ): Promise<
        ApiResponse<SalesSupplierDetailWithPurchasePaginationResponse>
    > => {
        const queryParams = new URLSearchParams();

        queryParams.append("page_no", String(filters.page_no || 1));
        queryParams.append("size", String(filters.size || 10));

        const response = await apiCall<
            ApiResponse<SalesSupplierDetailWithPurchasePaginationResponse>
        >(`/analytics/sales/supplier/purchase?${queryParams.toString()}`);
        return response;
    },
};
