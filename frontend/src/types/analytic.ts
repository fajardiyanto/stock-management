export interface DashboardStats {
    total_stock: number;
    total_fiber: number;
    total_purchase: number;
    total_sales: number;
    total_purchase_weight: number;
    total_sales_weight: number;
}

export interface DailyDashboardStats {
    daily_purchase_weight: number;
    daily_purchase_value: number;
    daily_sales_weight: number;
    daily_sales_value: number;
}

export interface SalesTrendData {
    month: string;
    sales_revenue: number;
    purchase_revenue: number;
}

export interface StockDistributionData {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number;
}

export interface UserData {
    name: string;
    total: number;
}

export interface SalesSupplierDetail {
    supplier_name: string;
    item_name: string;
    qty: number;
    price: number;
    customer_name: string;
    fiber_name: string;
}

export interface SupplierGroup {
    supplier_name: string;
    items: {
        item_name: string;
        sales: {
            qty: number;
            price: number;
            customer_name: string;
            fiber_name: string;
        }[];
    }[];
}

export interface SalesSupplierDetailPaginationResponse {
    size: number;
    page_no: number;
    total: number;
    data: SalesSupplierDetail[];
}

export interface SalesSupplierDetailFilter {
    size?: number;
    page_no?: number;
    month?: string;
    year?: string;
}

export interface SalesSupplierDetailWithPurchase {
    supplier_name: string;
    item_name: string;
    qty: number;
    price: number;
    customer_name: string;
    fiber_name: string;
    age_in_day: number;
    purchase_date: string;
    stock_weight: number;
    current_weight: number;
}

export interface SupplierGroupWithPurchase {
    supplier_name: string;
    items: {
        item_name: string;
        sales: {
            qty: number;
            price: number;
            customer_name: string;
            fiber_name: string;
            age_in_day: number;
            purchase_date: string;
            stock_weight: number;
            current_weight: number;
        }[];
    }[];
}

export interface SalesSupplierDetailWithPurchasePaginationResponse {
    size: number;
    page_no: number;
    total: number;
    data: SalesSupplierDetailWithPurchase[];
}

export interface DailyBookKeepingFilter {
    size?: number;
    page_no?: number;
    start_date?: string;
    end_date?: string;
}

export interface AnalyticStatsFilter {
    size: number;
    page_no: number;
    start_date?: string;
    end_date?: string;
}
