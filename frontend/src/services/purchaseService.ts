import { Purchasing, PurchasingPagination, CreatePurchasingRequest, PurchaseFilters, UpdatePurchaseRequest } from "../types/purchase";
import { ApiResponse } from "../types/index";
import { apiCall } from "./";

export const purchaseService = {
    createPurchase: async (data: CreatePurchasingRequest): Promise<ApiResponse<Purchasing>> => {
        const response = await apiCall<ApiResponse<Purchasing>>(
            '/purchase',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }
        );
        return response;
    },

    getAllPurchases: async (filters: PurchaseFilters = {}): Promise<ApiResponse<PurchasingPagination>> => {
        const queryParams = new URLSearchParams();

        queryParams.append('page', String(filters.page || 1));
        queryParams.append('size', String(filters.size || 10));

        if (filters.purchase_id) {
            queryParams.append('purchase_id', filters.purchase_id);
        }
        if (filters.supplier_id) {
            queryParams.append('supplier_id', filters.supplier_id);
        }
        if (filters.purchase_date) {
            queryParams.append('purchase_date', filters.purchase_date);
        }
        if (filters.payment_status && filters.payment_status !== 'ALL') {
            queryParams.append('payment_status', filters.payment_status);
        }
        if (filters.age_in_day && filters.age_in_day !== '0') {
            queryParams.append('age_in_day', filters.age_in_day);
        }


        const response = await apiCall<ApiResponse<PurchasingPagination>>(
            `/purchases?${queryParams.toString()}`
        );
        return response;
    },

    updatePurchase: async (purchaseId: string, data: UpdatePurchaseRequest): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<Purchasing>>(
            `/purchase/${purchaseId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }
        );
        return response;
    }
};