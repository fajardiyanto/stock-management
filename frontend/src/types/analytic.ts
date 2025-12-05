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