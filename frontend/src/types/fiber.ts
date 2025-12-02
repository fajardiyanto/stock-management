export const STATUS_OPTIONS_LIST = [
    { key: '', label: 'Semua Status' },
    { key: 'FREE', label: 'Tersedia' },
    { key: 'USED', label: 'Digunakan' },
];

export const STATUS_MAP = {
    '': 'Semua Status',
    FREE: 'Tersedia',
    USED: 'Digunakan'
} as const;

type FiberStatus = 'FREE' | 'USED';

export interface FiberRequest {
    name: string;
    status: FiberStatus;
}

export interface FiberResponse {
    uuid: string;
    name: string;
    status: FiberStatus;
    deleted: boolean;
    created_at: string;
}

export interface FiberPaginationResponse {
    size: number;
    page_no: number;
    total: number;
    data: FiberResponse[];
}

export interface BulkFiberRequest {
    data: FiberRequest[];
}

export interface FiberFilter {
    size?: number;
    page_no?: number;
    name?: string;
    status?: string;
}

export interface FiberList {
    uuid: string;
    name: string;
}