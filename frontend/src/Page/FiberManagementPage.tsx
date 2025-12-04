import React, { useState, useEffect, useCallback } from "react";
import FiberFilter from "../components/FiberComponents/FiberFilter";
import FiberTable from "../components/FiberComponents/FiberTable";
import {
    FiberRequest,
    FiberResponse,
    FiberPaginationResponse,
} from "../types/fiber";
import { Plus } from "lucide-react";
import FiberAddModal from "../components/FiberComponents/FiberFormModal";
import { useToast } from "../contexts/ToastContext";
import { fiberService } from "../services/fiberService";
import FiberModalDelete from "../components/FiberComponents/FiberModalDelete";

const FiberManagementPage: React.FC = () => {
    const [data, setData] = useState<FiberPaginationResponse>(
        {} as FiberPaginationResponse
    );
    const [loading, setLoading] = useState(false);
    const [searchName, setSearchName] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [modalType, setModalType] = useState<
        "ADD" | "EDIT" | "DETAIL" | "DELETE" | null
    >(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [error, setError] = useState<string>("");
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

    const totalPages = Math.ceil(data.total / pageSize);

    const { showToast } = useToast();

    const fetchFibers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fiberService.getAllFiber({
                page_no: currentPage,
                size: pageSize,
                name: searchName || undefined,
                status: statusFilter || undefined,
            });

            if (response.status_code === 200) {
                setData(response.data);
            } else {
                setError(response.message || "Failed to fetch fibers data");
                showToast(
                    response.message || "Failed to fetch fibers data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch fibers. Please try again.");
            showToast("Failed to fetch fibers. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    }, [searchName, statusFilter, currentPage, pageSize, showToast]);

    useEffect(() => {
        fetchFibers();
    }, [fetchFibers]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchFibers();
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

    const handleEditFiber = async () => {
        if (!editFormData.name) {
            showToast("Please fill all required fields", "warning");
            return;
        }

        try {
            const response = await fiberService.updateFiber(
                selectedFiber.uuid,
                editFormData
            );
            if (response.status_code === 200) {
                showToast("Fiber updated successfully!", "success");
                handleCloseModal();
                setCurrentPage(1);
                fetchFibers();
            } else {
                showToast(
                    response.message || "Failed to updated fiber",
                    "error"
                );
                setError(response.message || "Failed to updated fiber");
            }
        } catch (err) {
            showToast("Failed to updated fiber. Please try again.", "error");
        }
    };

    const handleOpenDelete = (fiber: FiberResponse) => {
        setSelectedFiber(fiber);
        setModalType("DELETE");
    };

    const handleDelete = async () => {
        try {
            const response = await fiberService.deleteFiber(selectedFiber.uuid);

            if (response.status_code === 200) {
                fetchFibers();
            } else {
                setError(response.message || "Failed to delete fiber");
                showToast(
                    response.message || "Failed to delete fiber",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to delete fiber. Please try again.");
            showToast("Failed to delete fiber. Please try again.", "error");
        } finally {
            fetchFibers();
            setModalType(null);
        }
    };

    const handleStatusChange = async (fiber: FiberResponse) => {
        try {
            const response = await fiberService.markFiberAvailable(fiber.uuid);

            if (response.status_code === 200) {
                fetchFibers();
            } else {
                setError(response.message || "Failed to mark fiber available");
                showToast(
                    response.message || "Failed to mark fiber available",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to mark fiber available. Please try again.");
            showToast(
                "Failed to mark fiber available. Please try again.",
                "error"
            );
        }
    };

    const handleCreateFiber = async () => {
        if (!formData.name) {
            showToast("Please fill all required fields", "warning");
            return;
        }

        try {
            const response = await fiberService.createFiber(formData);
            if (response.status_code === 200) {
                showToast("Fiber created successfully!", "success");
                handleCloseModal();
                setCurrentPage(1);
                fetchFibers();
            } else {
                showToast(
                    response.message || "Failed to create fiber",
                    "error"
                );
                setError(response.message || "Failed to create fiber");
            }
        } catch (err) {
            showToast("Failed to create fiber. Please try again.", "error");
        }
    };

    const handleCloseModal = () => {
        setModalType(null);
        fetchFibers();
    };

    if (loading && data.data?.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Loading fibers...</div>
            </div>
        );
    }

    if (error && data.data?.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{error}</p>
                <button
                    onClick={fetchFibers}
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
                    loading={loading}
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
