import React, { useState, useEffect, useCallback } from 'react';
import FiberFilter from '../components/FiberComponents/FiberFilter';
import FiberTable from '../components/FiberComponents/FiberTable';
import { FiberUnit } from '../types/fiber';

const MOCK_DATA: FiberUnit[] = [
    { id: 1, no: 1, name: 'LK 3', status: 'Tersedia', can_edit: true, can_delete: true, can_check_in: false, can_check_out: true },
    { id: 2, no: 2, name: 'Org 019', status: 'Tersedia', can_edit: true, can_delete: true, can_check_in: false, can_check_out: true },
    { id: 3, no: 3, name: 'Org 555', status: 'Tersedia', can_edit: true, can_delete: true, can_check_in: false, can_check_out: true },
    { id: 4, no: 4, name: 'Org 333', status: 'Tersedia', can_edit: true, can_delete: true, can_check_in: false, can_check_out: true },
    { id: 5, no: 5, name: 'Org 222', status: 'Tersedia', can_edit: true, can_delete: true, can_check_in: false, can_check_out: true },
    { id: 6, no: 6, name: 'Org 111', status: 'Digunakan', can_edit: true, can_delete: true, can_check_in: true, can_check_out: false },
    { id: 7, no: 7, name: 'Org 334', status: 'Digunakan', can_edit: true, can_delete: true, can_check_in: true, can_check_out: false },
    { id: 8, no: 8, name: 'Org 123', status: 'Tersedia', can_edit: true, can_delete: true, can_check_in: false, can_check_out: true },
];


const FiberManagementPage: React.FC = () => {
    const [data, setData] = useState<FiberUnit[]>(MOCK_DATA);
    const [loading, setLoading] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalData, setTotalData] = useState(MOCK_DATA.length);
    const totalPages = Math.ceil(totalData / pageSize);

    const filterData = useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            const filtered = MOCK_DATA.filter(unit => {
                const nameMatch = unit.name.toLowerCase().includes(searchName.toLowerCase());
                const statusMatch = statusFilter === '' || unit.status.toUpperCase() === statusFilter.toUpperCase();
                return nameMatch && statusMatch;
            });

            setTotalData(filtered.length);
            setData(filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize));
            setLoading(false);
        }, 300);
    }, [searchName, statusFilter, currentPage, pageSize]);

    useEffect(() => {
        filterData();
    }, [filterData]);


    const handleSearch = () => {
        setCurrentPage(1);
        filterData();
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleOpenAddModal = () => {
        console.log("Open Add Fiber Modal");
    };

    const handleEdit = (unit: FiberUnit) => {
        console.log("Editing unit:", unit.id);
    };

    const handleDelete = (unit: FiberUnit) => {
        console.log("Deleting unit:", unit.id);
    };

    const handleStatusChange = (unit: FiberUnit, newStatus: 'CHECK_IN' | 'CHECK_OUT') => {
        const newStatusLabel = newStatus === 'CHECK_IN' ? 'Tersedia' : 'Digunakan';
        console.log(`Changing status for ${unit.name} to ${newStatusLabel}`);
    };


    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">Manajemen Fiber</h1>
                    <p className="text-gray-500 mt-1">Kelola wadah fiber untuk penjualan ikan</p>
                </div>
            </header>

            <FiberFilter
                searchName={searchName}
                setSearchName={setSearchName}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onSearch={handleSearch}
                onOpenAddModal={handleOpenAddModal}
            />

            <FiberTable
                data={data}
                totalData={totalData}
                currentPage={currentPage}
                pageSize={pageSize}
                totalPages={totalPages}
                loading={loading}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
};

export default FiberManagementPage;