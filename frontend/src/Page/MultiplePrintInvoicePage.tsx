import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SaleEntry } from "../types/sales";
import { salesService } from "../services/salesService";
import { formatDate } from "../utils/FormatDate";

const PrintInvoicePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    const saleId = searchParams.get("saleId");
    const navigate = useNavigate();

    const [invoicesData, setInvoicesData] = useState<SaleEntry[]>([]);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);

        try {
            const response = await salesService.getAllSales({
                page: 1,
                size: 100,
                sales_id: saleId || undefined,
            });

            if (response.status_code === 200) {
                setInvoicesData(response.data.data);
            } else {
                setError(response.message || "Failed to fetch sales data");
            }
        } catch (err) {
            setError("Failed to fetch sales data. Please try again");
        } finally {
            setLoading(false);
        }
    }, [saleId]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [loading]);

    // Handle after print - redirect back
    // useEffect(() => {
    //     const handleAfterPrint = () => {
    //         // Optional: Navigate back after printing
    //         // navigate(-1);
    //     };

    //     window.addEventListener("afterprint", handleAfterPrint);

    //     return () => {
    //         window.removeEventListener("afterprint", handleAfterPrint);
    //     };
    // }, [navigate]);

    const formatRupiah = (amount: number): string => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{error}</p>
                <button
                    onClick={fetchInvoices}
                    className="mt-4 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Loading invoices...</div>
            </div>
        );
    }

    return (
        <>
            <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-container {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 20px;
            box-shadow: none;
          }
          
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          
          .page-break:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
        
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 20px auto;
            padding: 20mm;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          .page-break {
            margin-bottom: 40px;
            border-bottom: 2px dashed #ccc;
            padding-bottom: 40px;
          }
        }
      `}</style>
            <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
                <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">
                        {invoicesData.length} Invoice
                        {invoicesData.length > 1 ? "s" : ""}
                    </span>
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg"
                >
                    🖨️ Print
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition shadow-lg"
                >
                    ← Kembali
                </button>
            </div>

            {invoicesData.map((invoiceData, invoiceIndex) => {
                const subtotal =
                    invoiceData.sold_items?.reduce(
                        (sum, item) => sum + item.total_amount,
                        0
                    ) || 0;

                const addOnTotal =
                    invoiceData.add_ons?.reduce(
                        (sum, a) => sum + a.addon_price,
                        0
                    ) || 0;

                const taxAmount = (subtotal + addOnTotal) * 0.05;

                const grandTotal = subtotal + addOnTotal + taxAmount;

                return (
                    <div
                        key={invoiceData.sale_code}
                        className={`print-container font-sans ${
                            invoiceIndex < invoicesData.length - 1
                                ? "page-break"
                                : ""
                        }`}
                    >
                        <div className="mb-8 pb-6 border-b-2 border-gray-800">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                        INVOICE
                                    </h1>
                                    <p className="text-gray-600">
                                        No: {invoiceData.sale_code}
                                    </p>
                                    <p className="text-gray-600">
                                        Tanggal:{" "}
                                        {formatDate(invoiceData.sales_date)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-2xl font-bold text-blue-600 mb-2">
                                        PERUSAHAAN ANDA
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Jl. Alamat Perusahaan No. 456
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Jakarta Pusat, 10110
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Telp: (021) 1234-5678
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Email: info@perusahaan.com
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                                Kepada:
                            </h3>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="font-bold text-gray-900 text-lg">
                                    {invoiceData.customer.name}
                                </p>
                                <p className="text-gray-600">
                                    {invoiceData.customer.shipping_address}
                                </p>
                            </div>
                        </div>

                        <h4 className="text-lg font-semibold text-gray-800 mb-4">
                            Rincian Barang:
                        </h4>
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="bg-gray-800 text-white">
                                    <th className="text-left py-3 px-4 font-semibold">
                                        Deskripsi
                                    </th>
                                    <th className="text-center py-3 px-4 font-semibold">
                                        Qty
                                    </th>
                                    <th className="text-right py-3 px-4 font-semibold">
                                        Harga Satuan
                                    </th>
                                    <th className="text-right py-3 px-4 font-semibold">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData.sold_items.map((item, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-gray-200"
                                    >
                                        <td className="py-3 px-4 text-gray-900">
                                            {item.stock_sort_name}
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-700">
                                            {item.weight} kg
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-700">
                                            {formatRupiah(
                                                item.price_per_kilogram
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                                            {formatRupiah(item.total_amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <h4 className="text-lg font-semibold text-gray-800 mb-4">
                            Rincian Tambahan:
                        </h4>
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="bg-gray-800 text-white">
                                    <th className="text-left py-3 px-4 font-semibold">
                                        Deskripsi
                                    </th>
                                    <th className="text-right py-3 px-4 font-semibold">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData.add_ons.map((item, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-gray-200"
                                    >
                                        <td className="py-3 px-4 text-gray-900">
                                            {item.addon_name}
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                                            {formatRupiah(item.addon_price)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end mb-8">
                            <div className="w-80">
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-600">
                                        Subtotal:
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {formatRupiah(subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-600">
                                        Tambahan:
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {formatRupiah(addOnTotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-600">
                                        PPN (5%):
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {formatRupiah(taxAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between py-3 bg-gray-800 text-white px-4 rounded mt-2">
                                    <span className="font-bold text-lg">
                                        TOTAL:
                                    </span>
                                    <span className="font-bold text-xl">
                                        {formatRupiah(grandTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* {invoiceData.notes && ( */}
                        <div className="mb-8 p-4 bg-blue-50 rounded border border-blue-200">
                            <h4 className="font-semibold text-gray-800 mb-2">
                                Catatan:
                            </h4>
                            <p className="text-sm text-gray-600">
                                Terima kasih atas kepercayaan Anda. Pembayaran
                                dilakukan dalam 30 hari.
                            </p>
                        </div>
                        {/* )} */}

                        {/* <div className="flex justify-between mt-16 pt-8 border-t border-gray-300">
                        <div className="text-center w-1/3">
                            <p className="text-sm text-gray-600 mb-16">
                                Hormat Kami,
                            </p>
                            <div className="border-t border-gray-800 pt-2">
                                <p className="font-semibold text-gray-900">
                                    Manager
                                </p>
                            </div>
                        </div>
                        <div className="text-center w-1/3">
                            <p className="text-sm text-gray-600 mb-16">
                                Penerima,
                            </p>
                            <div className="border-t border-gray-800 pt-2">
                                <p className="font-semibold text-gray-900">
                                    Customer
                                </p>
                            </div>
                        </div>
                    </div> */}

                        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                            <p className="text-xs text-gray-500">
                                Invoice ini dibuat secara otomatis dan sah tanpa
                                tanda tangan
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Halaman {invoiceIndex + 1} dari{" "}
                                {invoicesData.length}
                            </p>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default PrintInvoicePage;
