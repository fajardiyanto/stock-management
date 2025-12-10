import React, { useState, useMemo } from "react";
import FiberFilter from "../components/FiberComponents/FiberFilter";
import FiberTable from "../components/FiberComponents/FiberTable";
import { FiberRequest, FiberResponse } from "../types/fiber";
import { Plus } from "lucide-react";
import FiberAddModal from "../components/FiberComponents/FiberFormModal";
import FiberModalDelete from "../components/FiberComponents/FiberModalDelete";
import { useFiber } from "../hooks/fiber/useFiber";
import { useCreateFiber } from "../hooks/fiber/useCreateFiber";
import { useStatusChange } from "../hooks/fiber/useStatusChange";
import { useDeleteFiber } from "../hooks/fiber/useDeleteFiber";
import { useEditFiber } from "../hooks/fiber/useEditFiber";
import { useToast } from "../contexts/ToastContext";

const FiberManagementPage: React.FC = () => {
    const [searchName, setSearchName] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [modalType, setModalType] = useState<
        "ADD" | "EDIT" | "DETAIL" | "DELETE" | null
    >(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedFiber, setSelectedFiber] = useState<FiberResponse>(
        {} as FiberResponse
    );

    const initialAddFiberFormData: FiberRequest = {
        name: "",
        status: "FREE",
    };
    const [formData, setFormData] = useState<FiberRequest>(
        initialAddFiberFormData
    );

    const initialFormEditFiberData: FiberRequest = { name: "", status: "FREE" };
    const [editFormData, setEditFormData] = useState<FiberRequest>(
        initialFormEditFiberData
    );

    const { showToast } = useToast();

    const fiberFilter = {
        page_no: currentPage,
        size: pageSize,
        name: searchName || undefined,
        status: statusFilter || undefined,
    };

    const memoFilter = useMemo(
        () => fiberFilter,
        [JSON.stringify(fiberFilter)]
    );
    const {
        data,
        loading: fiberLoading,
        error: fiberError,
        refetch: refetchFiber,
    } = useFiber(memoFilter);

    const totalPages = Math.ceil(data?.total / pageSize);

    const handleSearch = () => {
        setCurrentPage(1);
        refetchFiber();
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleOpenAddModal = () => {
        setFormData(initialAddFiberFormData);
        setModalType("ADD");
    };

    const handleOpenEdit = (fiber: FiberResponse) => {
        setSelectedFiber(fiber);
        setEditFormData({
            name: fiber.name,
            status: fiber.status,
        });
        setModalType("EDIT");
    };

    const { editFiber, error: editFiberError } = useEditFiber();
    const handleEditFiber = async () => {
        const success = await editFiber(selectedFiber.uuid, editFormData);
        if (success) {
            handleCloseModal();
            setCurrentPage(1);
            refetchFiber();
        } else {
            showToast(editFiberError, "error");
        }
    };

    const handleOpenDelete = (fiber: FiberResponse) => {
        setSelectedFiber(fiber);
        setModalType("DELETE");
    };

    const { deleteFiber, error: deleteFiberError } = useDeleteFiber();
    const handleDelete = async () => {
        const success = await deleteFiber(selectedFiber.uuid);
        if (success) {
            refetchFiber();
            setModalType(null);
        } else {
            showToast(deleteFiberError, "error");
        }
    };

    const { statusChange, error: statusChangeError } = useStatusChange();
    const handleStatusChange = async (fiber: FiberResponse) => {
        const success = await statusChange(fiber);
        if (success) {
            refetchFiber();
        } else {
            showToast(statusChangeError, "error");
        }
    };

    const { createFiber, error: createFiberError } = useCreateFiber();
    const handleCreateFiber = async () => {
        const success = await createFiber(formData);
        if (success) {
            handleCloseModal();
            setCurrentPage(1);
            refetchFiber();
        } else {
            showToast(createFiberError, "error");
        }
    };

    const handleCloseModal = () => {
        setModalType(null);
        refetchFiber();
    };

    if (fiberLoading) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Loading fibers...</div>
            </div>
        );
    }

    if (fiberError) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{fiberError}</p>
                <button
                    onClick={refetchFiber}
                    className="mt-4 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
                <header className="flex justify-between items-center mb-4 bg-white p-6 rounded-xl shadow-md">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800">
                            Manajemen Fiber
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Kelola wadah fiber untuk penjualan ikan
                        </p>
                    </div>

                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition shadow-lg"
                    >
                        <Plus size={18} /> Tambah Fiber
                    </button>
                </header>

                <FiberFilter
                    searchName={searchName}
                    setSearchName={setSearchName}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    onSearch={handleSearch}
                />

                <FiberTable
                    data={data}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    loading={fiberLoading}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    onStatusChange={handleStatusChange}
                />
            </div>

            {modalType === "ADD" && (
                <FiberAddModal
                    type="ADD"
                    title="Add New Fiber"
                    initialData={formData}
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleCreateFiber}
                    onClose={handleCloseModal}
                />
            )}

            {modalType === "EDIT" && (
                <FiberAddModal
                    type="EDIT"
                    title="Edit New Fiber"
                    initialData={editFormData}
                    formData={editFormData}
                    setFormData={setEditFormData}
                    onSubmit={handleEditFiber}
                    onClose={handleCloseModal}
                />
            )}

            {modalType === "DELETE" && (
                <FiberModalDelete
                    name={selectedFiber.name}
                    onConfirm={handleDelete}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default FiberManagementPage;
