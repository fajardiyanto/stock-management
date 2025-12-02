import { Supplier } from "./purchase";

export interface StockEntriesPagination {
    size: number;
    page_no: number;
    total: number;
    data: StockEntry[];
}

export interface StockEntry {
    uuid: string;
    stock_code: string;
    age_in_day: number;
    supplier: Supplier;
    purchase_date: string;
    purchase_id: string;
    stock_items: StockItem[];
}

export interface StockItem {
    uuid: string;
    stock_entry_id: string;
    item_name: string;
    weight: number;
    price_per_kilogram: number;
    total_payment: number;
    is_sorted: boolean;
    stock_sorts: StockSortResponse[];
}

export interface StockSortResponse {
    id: number;
    uuid: string;
    stock_item_id: string;
    sorted_item_name: string;
    weight: number;
    price_per_kilogram: number;
    stock_entry_id: string;
    stock_code: string;
    current_weight: number;
    total_cost: number;
    is_shrinkage: boolean;
}

export interface CreateStockItem {
    item_name: string;
    weight: number;
    price_per_kilogram: number;
}

export interface SupplierOption {
    uuid: string;
    name: string;
}

export interface StockEntriesFilters {
    page?: number;
    size?: number;
    stock_id?: string;
    supplier_id?: string;
    purchase_date?: string;
    age_in_day?: string;
}

export interface StockSortInfoCardResponse {
    uuid: string;
    stock_code: string;
    stock_item: CurrentStockItemInfo;
}

export interface CurrentStockItemInfo {
    uuid: string;
    item_name: string;
    weight: number;
    price_per_kilogram: number;
    already_sortir: number;
    remaining_weight: number;
    total_payment: number;
    is_sorted: boolean;
    stock_sorts: StockSortResponse[];
}

export interface SubmitSortRequest {
    stock_item_uuid: string;
    stock_sort_request: StockSortRequest[];
}

export interface StockSortRequest {
    uuid?: string;
    sorted_item_name: string;
    weight: number;
    price_per_kilogram: number;
    current_weight: number;
    is_shrinkage: boolean;
}

export interface StockConfirmRequest {
    stock_id: string;
    stock_code: string;
}