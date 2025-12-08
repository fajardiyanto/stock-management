import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { authService } from "../services/authService";
import { CreateUserRequest, User, UpdateUserRequest } from "../types/user";
import { useToast } from "../contexts/ToastContext";
import { CashFlowResponse } from "../types/payment";
import { paymentService } from "../services/paymentService";
import UserTable from "../components/UserComponents/UserTable";
import UserFilter from "../components/UserComponents/UserFilter";
import UserModalForm from "../components/UserComponents/UserModalForm";
import UserModalDetail from "../components/UserComponents/UserModalDetail";
import UserModalDelete from "../components/UserComponents/UserModalDelete";

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchName, setSearchName] = useState("");
    const [searchPhone, setSearchPhone] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [error, setError] = useState<string>("");
    const [pageSize, setPageSize] = useState(10);
    const [modalType, setModalType] = useState<
        "ADD" | "EDIT" | "DETAIL" | "DELETE" | null
    >(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [cashFlows, setCashFlows] = useState<CashFlowResponse>(
        {} as CashFlowResponse
    );

    const { showToast } = useToast();

    const initialFormData: UpdateUserRequest = {
        name: "",
        phone: "",
        role: "BUYER",
        address: "",
        shipping_address: "",
        tax_payer_identification_number: "",
        password: "",
    };
    const [editFormData, setEditFormData] =
        useState<UpdateUserRequest>(initialFormData);
    const initialAddUserFormData: CreateUserRequest = {
        name: "",
        phone: "",
        role: "BUYER",
        address: "",
        shipping_address: "",
        tax_payer_identification_number: "",
        password: "",
    };

    const [addFormData, setAddFormData] = useState<CreateUserRequest>(
        initialAddUserFormData
    );

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await authService.getListUsers({
                page: currentPage,
                size: pageSize,
                name: searchName || undefined,
                phone: searchPhone || undefined,
            });

            if (response.status_code === 200) {
                setUsers(response.data.data);
                setTotalUsers(response.data.total);
            } else {
                setError(response.message || "Failed to fetch users");
                showToast(response.message || "Failed to fetch users", "error");
            }
        } catch (err) {
            setError("Failed to fetch users. Please try again.");
            showToast("Failed to fetch users. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchName, searchPhone, pageSize, showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenAdd = () => {
        setAddFormData(initialAddUserFormData);
        setModalType("ADD");
    };

    const handleOpenEdit = (user: User) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name,
            phone: user.phone,
            role: user.role,
            address: user.address,
            shipping_address: user.shipping_address,
            tax_payer_identification_number:
                user.tax_payer_identification_number || "",
            password: "",
        });
        setModalType("EDIT");
    };

    const refreshCashFlows = async (userId: string) => {
        try {
            const response = await paymentService.getAllPaymentByUserId(userId);

            if (response.status_code === 200) {
                setCashFlows(response.data);
            } else {
                setError(response.message || "Failed to fetch cash flows");
                showToast(
                    response.message || "Failed to fetch cash flows",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch cash flows. Please try again.");
            showToast("Failed to fetch cash flows. Please try again.", "error");
        }
    };

    const handleOpenDetail = async (user: User) => {
        setSelectedUser(user);
        await refreshCashFlows(user.uuid);
        setModalType("DETAIL");
    };

    const handleOpenDelete = (user: User) => {
        setSelectedUser(user);
        setModalType("DELETE");
    };

    const handleCloseModal = () => {
        setModalType(null);
        setSelectedUser(null);
        fetchUsers();
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleCreateUser = async () => {
        if (
            !addFormData.name ||
            !addFormData.phone ||
            !addFormData.password ||
            !addFormData.role ||
            !addFormData.address
        ) {
            showToast("Please fill all required fields", "warning");
            return;
        }

        try {
            const response = await authService.createUser(addFormData);
            if (response.status_code === 200) {
                showToast("User created successfully!", "success");
                handleCloseModal();
                setCurrentPage(1);
                fetchUsers();
            } else {
                showToast(
                    `Failed to create user: ${response.message}`,
                    "error"
                );
            }
        } catch (err) {
            showToast("Failed to create user. Please try again.", "error");
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        const dataToUpdate: UpdateUserRequest = {
            name: editFormData.name,
            phone: editFormData.phone,
            role: editFormData.role,
            address: editFormData.address,
            shipping_address: editFormData.shipping_address,
            tax_payer_identification_number:
                editFormData.tax_payer_identification_number,
        };

        if (editFormData.password) {
            dataToUpdate.password = editFormData.password;
        }

        try {
            const response = await authService.updateUser(
                selectedUser.uuid,
                dataToUpdate
            );

            if (response.status_code === 200) {
                showToast("User updated successfully!", "success");
                handleCloseModal();
                fetchUsers();
            } else {
                showToast(
                    `Failed to update user: ${response.message}`,
                    "error"
                );
            }
        } catch (err) {
            showToast("Failed to update user. Please try again.", "error");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedUser) return;

        try {
            const response = await authService.deleteUser(selectedUser.uuid);

            if (response.status_code === 200) {
                showToast("User deleted successfully!", "success");
                handleCloseModal();
                fetchUsers();
            } else {
                showToast(
                    `Failed to delete user: ${response.message}`,
                    "error"
                );
            }
        } catch (err) {
            showToast("Failed to delete user. Please try again.", "error");
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchUsers();
    };

    const handleClearSearch = () => {
        setSearchName("");
        setSearchPhone("");
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalUsers / pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Loading users...</div>
            </div>
        );
    }

    if (error && users.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{error}</p>
                <button
                    onClick={fetchUsers}
                    className="mt-4 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
                <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800">
                            User Management
                        </h1>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition transform hover:scale-105"
                    >
                        <Plus size={20} />
                        Add New User
                    </button>
                </header>

                <UserFilter
                    searchName={searchName}
                    setSearchName={setSearchName}
                    searchPhone={searchPhone}
                    setSearchPhone={setSearchPhone}
                    onSearch={handleSearch}
                    onClear={handleClearSearch}
                />

                <UserTable
                    users={users}
                    loading={loading}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalUsers={totalUsers}
                    totalPages={totalPages}
                    onViewDetail={handleOpenDetail}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                />
            </div>

            {modalType === "DETAIL" && selectedUser && (
                <UserModalDetail
                    user={selectedUser}
                    cashFlows={cashFlows}
                    onClose={handleCloseModal}
                    onEdit={() => {
                        handleCloseModal();
                        handleOpenEdit(selectedUser);
                    }}
                    onRefresh={() => refreshCashFlows(selectedUser.uuid)}
                />
            )}

            {modalType === "EDIT" && selectedUser && (
                <UserModalForm
                    type="EDIT"
                    title={`Edit User: ${selectedUser.name}`}
                    initialData={editFormData}
                    formData={editFormData}
                    setFormData={setEditFormData}
                    onSubmit={handleUpdateUser}
                    onClose={handleCloseModal}
                />
            )}

            {modalType === "ADD" && (
                <UserModalForm
                    type="ADD"
                    title="Add New User"
                    initialData={addFormData}
                    formData={addFormData}
                    setFormData={setAddFormData}
                    onSubmit={handleCreateUser}
                    onClose={handleCloseModal}
                />
            )}

            {modalType === "DELETE" && selectedUser && (
                <UserModalDelete
                    userName={selectedUser.name}
                    onConfirm={handleDeleteConfirm}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default UserManagementPage;
