import { ApiResponse } from "../types/index";
import { SubmitSaleRequest, SalePaginationResponse, SaleFilter } from "../types/sales";
import { apiCall } from "./";

export const salesService = {
    createSales: async (data: SubmitSaleRequest): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/sales`,
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

    getAllSales: async (filters: SaleFilter = {}): Promise<ApiResponse<SalePaginationResponse>> => {
        const queryParams = new URLSearchParams();

        queryParams.append('page', String(filters.page || 1));
        queryParams.append('size', String(filters.size || 10));

        if (filters.customer_id) {
            queryParams.append('customer_id', filters.customer_id);
        }
        if (filters.id) {
            queryParams.append('id', filters.id);
        }
        if (filters.sales_date) {
            queryParams.append('sales_date', filters.sales_date);
        }
        if (filters.payment_status && filters.payment_status !== 'ALL') {
            queryParams.append('payment_status', filters.payment_status);
        }

        const response = await apiCall<ApiResponse<SalePaginationResponse>>(
            `/sales?${queryParams.toString()}`
        );
        return response;
    },

    deleteSale: async (saleId: string): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/sale/${saleId}`,
            {
                method: 'DELETE',
            }
        );
        return response;
    }
}