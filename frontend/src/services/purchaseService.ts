import { API_BASE_URL } from "../constants/constants";
import { Purchasing, PurchasingPagination, CreatePurchasingRequest, PurchaseFilters } from "../types/purchase";
import { ApiResponse } from "../types/index";
import { apiCall } from "./authService";

export const purchaseService = {
    createPurchase: async (purchaseData: CreatePurchasingRequest): Promise<ApiResponse<Purchasing>> => {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_BASE_URL}/purchase`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",     
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(purchaseData),
        });

        const data: ApiResponse<Purchasing> = await response.json();
        return data;
    },

    getAllPurchases: async (filters: PurchaseFilters = {}): Promise<ApiResponse<PurchasingPagination>> => {
        const queryParams = new URLSearchParams();

        queryParams.append('page', String(filters.page || 1));
        queryParams.append('size', String(filters.size || 10));


        const response = await apiCall<ApiResponse<PurchasingPagination>>(
            `/purchases?${queryParams.toString()}`
        );
        return response;
    },
};