export const STATUS_OPTIONS = [
    { key: '', label: 'Semua Status' },
    { key: 'TERSEDIA', label: 'Tersedia' },
    { key: 'DIGUNAKAN', label: 'Digunakan' },
];

export interface FiberUnit {
    id: number;
    no: number;
    name: string;
    status: 'Tersedia' | 'Digunakan';
    can_edit: boolean;
    can_delete: boolean;
    can_check_in: boolean;
    can_check_out: boolean;
}