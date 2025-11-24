export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

export const AGE_FILTER_OPTIONS = [
    { key: '0', label: 'Semua Umur Pembelian' },
    { key: 'LT_1', label: 'Kurang dari 1 hari' },
    { key: 'GT_1', label: 'Lebih dari 1 hari' },
    { key: 'GT_10', label: 'Lebih dari 10 hari' },
    { key: 'GT_30', label: 'Lebih dari 30 hari' },
];
