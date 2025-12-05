export interface DashboardStats {
    total_stock: number;
    total_fiber: number;
    total_purchase: number;
    total_sales: number;
    daily_purchase_weight: number;
    daily_purchase_value: number;
    daily_sold_weight: number;
    daily_revenue: number;
}

export interface DashboardSalesItem {
    id: number;
    customer_id: string;
    stock_code: string;
    supplier: string;
    sort_result: string;
    weight: number;
    price_per_kg: number;
    total: number;
    fiber: number;
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