import { FiberList } from "./fiber";
import { PaymentStatus } from "./payment";

export type SaleStatus = "MENUNGGU" | "DIKIRIM" | "SELESAI" | "BATAL";

export interface SoldItem {
    id: string;
    stock_sort_id: string;
    stock_code: string;
    stock_sort_name: string;
    price_per_kilogram: number;
    weight: number;
    total_amount: number;
}

export interface SoldAddon {
    id: string;
    addon_name: string;
    addon_price: number;
}

export interface SaleEntry {
    id: number;
    uuid: string;
    sale_code: string;
    customer: Customer;
    created_at: string;
    payment_late_day: number;
    export_sale: boolean;
    total_amount: number;
    paid_amount: number;
    payment_status: PaymentStatus;
    sales_date: string;
    sold_items: SoldItem[];
    add_ons: SoldAddon[];
    fiber_used: FiberList[];
    last_payment_date: string;
}

export interface SaleFilter {
    page?: number;
    size?: number;
    payment_status?: PaymentStatus;
    keyword?: string;
    sales_id?: string;
    sales_date?: string;
    customer_id?: string;
}

export interface Customer {
    uuid: string;
    name: string;
    phone: string;
    address: string;
    shipping_address: string;
}

export interface CreateSaleItemRequest {
    stock_sort_id: string;
    weight: number;
    price_per_kilogram: number;
    total_amount: number;
    stock_code: string;
}

export interface CreateAddOnRequest {
    name: string;
    price: number;
}

export interface SubmitSaleRequest {
    customer_id?: string;
    sales_date: string;
    export_sale: boolean;
    sale_items: CreateSaleItemRequest[];
    add_ons: CreateAddOnRequest[];
    fiber_allocations: FiberAllocation[];
    total_amount: number;
}

export interface BuyerOption {
    uuid: string;
    name: string;
}

export interface SelectedSaleItem extends CreateSaleItemRequest {
    id: number;
    tempId: string;
    stock_code: string;
    item_name: string;
    total_amount: number;
}

export interface FiberAllocation {
    item_id: string;
    fiber_id: string;
    fiber_name: string;
    weight: number;
}

export interface SelectedAddOn extends CreateAddOnRequest {
    tempId: string;
    total_price: number;
}

export interface ItemSortirOption {
    uuid: string;
    stock_code: string;
    weight: number;
    price_per_kilogram: number;
}

export interface SaleConfirmRequest {
    sale_id: string;
    sale_code: string;
}

export interface SalePaginationResponse {
    size: number;
    page_no: number;
    total: number;
    data: SaleEntry[];
}

export interface SaleEntry {
    id: number;
    uuid: string;
    sale_code: string;
    customer: Customer;
    created_at: string;
    payment_late_day: number;
    export_sale: boolean;
    total_amount: number;
    remaining_amount: number;
    paid_amount: number;
    payment_status: PaymentStatus;
    sales_date: string;
    sold_items: SoldItem[];
    add_ons: SoldAddon[];
    fiber_used: FiberList[];
    last_payment_date: string;
}
