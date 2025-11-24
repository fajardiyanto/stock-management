import React, { useCallback, useEffect, useState } from 'react';
import { Plus, ArrowLeft, Calendar, ChevronDown } from 'lucide-react';
import StockItemInput from '../components/StockManagement/StockItemInput';
import { CreateStockItem, SupplierOption } from '../types/stock';
import { CreatePurchasingRequest } from '../types/purchase';
import { purchaseService } from "../services/purchaseService";
import { useToast } from "../contexts/ToastContext";
import { User } from '../types';
import { authService } from '../services/authService';

const getDefaultDate = (): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
};

const initialItem: CreateStockItem = {
    item_name: '',
    weight: 0,
    price_per_kilogram: 0,
};

const CreatePurchasingPage: React.FC = () => {
    const [formData, setFormData] = useState<CreatePurchasingRequest>({
        supplier_id: '',
        purchase_date: getDefaultDate(),
        stock_items: [initialItem],
    });

    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [supplierOptions, setSupplierOptions] = useState<User[]>([]);
    const { showToast } = useToast();

    const handleItemChange = (
        index: number,
        field: keyof CreateStockItem,
        value: string | number
    ) => {
        const newItems = [...formData.stock_items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, stock_items: newItems });
    };

    const handleAddItem = () => {
        setFormData((prevData) => ({
            ...prevData,
            stock_items: [...prevData.stock_items, { ...initialItem }],
        }));
    };

    const handleRemoveItem = (index: number) => {
        if (formData.stock_items.length <= 1) {
            console.error("Minimal 1 stock item must remain.");
            return;
        }
        const newItems = formData.stock_items.filter((_, i) => i !== index);
        setFormData({ ...formData, stock_items: newItems });
    };

    const handleSupplierChange = (id: string) => {
        setFormData({ ...formData, supplier_id: id });
    };

    const handleDateChange = (date: string) => {
        setFormData({ ...formData, purchase_date: date });
    };


    const handleReset = () => {
        setFormData({
            supplier_id: '',
            purchase_date: getDefaultDate(),
            stock_items: [initialItem],
        });
        setError('');
        showToast("Form berhasil di-reset", "warning");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;
        setError('');

        if (!formData.supplier_id) {
            showToast("Harap pilih supplier.", "warning");
            return;
        }

        const submissionItems = formData.stock_items.filter(item =>
            item.item_name && (item.weight > 0 || item.price_per_kilogram > 0)
        );

        if (submissionItems.length === 0) {
            showToast("Harap masukkan minimal satu item stok yang valid.", "warning");
            return;
        }

        const formattedPurchaseDate = formData.purchase_date + ':00Z';
        const finalPayload: CreatePurchasingRequest = {
            ...formData,
            purchase_date: formattedPurchaseDate,
            stock_items: submissionItems
        };

        setIsSubmitting(true);
        setLoading(true);

        try {
            const response = await purchaseService.createPurchase(finalPayload);

            if (response.status_code === 201 || response.status_code === 200) {
                showToast("Stok berhasil disimpan!", "success");
                handleReset();
            } else {
                const errorMessage = response.message || "Gagal menyimpan stok. Coba lagi.";
                setError(errorMessage);
                showToast(errorMessage, "error");
            }
        } catch (err) {
            const errorMessage = "Terjadi kesalahan jaringan atau server.";
            setError(errorMessage);
            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authService.getListUserRoles('supplier');
            if (response.status_code === 200) {
                setSupplierOptions(response.data);
            } else {
                setError(response.message || "Failed to fetch supplier data");
                showToast(
                    response.message || "Failed to fetch supplier data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch supplier data. Please try again");
            showToast("Failed to fetch supplier data. Please try again", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const canRemoveItem = formData.stock_items.length > 1;
    const submitButtonText = isSubmitting ? 'Menyimpan...' : 'Simpan Stok';

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-10 font-sans">
            <header className="mb-8">
                <a href="#" className="flex items-center text-gray-600 hover:text-gray-800 transition mb-4 font-medium">
                    <ArrowLeft size={18} className="mr-2" />
                    Kembali
                </a>
                <h1 className="text-3xl font-extrabold text-gray-900">Tambah Stok</h1>
                <p className="text-gray-500 mt-1">Buat stok baru dari supplier</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-6 lg:p-8 space-y-8">

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-4">Informasi Stok</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <div className="relative">
                                <select
                                    value={formData.supplier_id}
                                    onChange={(e) => handleSupplierChange(e.target.value)}
                                    className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer shadow-sm"
                                    disabled={isSubmitting || loading}
                                >
                                    <option value="">All Suppliers</option>
                                    {supplierOptions.map(s => (
                                        <option key={s.uuid} value={s.uuid} disabled={s.uuid === ''}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Stok</label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    value={formData.purchase_date}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none pr-8 shadow-sm"
                                    disabled={isSubmitting || loading}
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6 pt-4">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-xl font-semibold text-gray-800">Item Stok</h2>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-md disabled:opacity-50"
                            disabled={isSubmitting || loading}
                        >
                            <Plus size={18} /> Tambah Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.stock_items.map((item, index) => (
                            <StockItemInput
                                key={index}
                                index={index}
                                item={item}
                                onChange={handleItemChange}
                                onRemove={handleRemoveItem}
                                canRemove={canRemoveItem && !isSubmitting && !loading}
                            />
                        ))}
                    </div>
                </section>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium disabled:opacity-50"
                        disabled={isSubmitting || loading}
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg disabled:opacity-50"
                        disabled={isSubmitting || loading}
                    >
                        {submitButtonText}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePurchasingPage;