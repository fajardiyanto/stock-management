import { ApiResponse } from "../types/index";
import { SubmitSaleRequest, SaleEntry } from "../types/sales";
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

    getAllSales: async (): Promise<ApiResponse<SaleEntry[]>> => {
        const response = await apiCall<ApiResponse<SaleEntry[]>>(
            `/sales`
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