export interface StockItem {
    name: string;
    weight: number;
    pricePerKilogram: number;
    total: number;
    sortirName?: string;
    sortirPricePerKilogram?: number;
    sortirWeightAvailable?: number;
    sortirTotal?: number;
    shrinkage?: number;
    shrinkageAmount?: number;
    shrinkageTotal?: number;
}

export interface Stock {
    id: string;
    supplier: string;
    createdDate: string;
    ageInDays: number;
    items: StockItem[];
}