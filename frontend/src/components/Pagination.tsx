import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    entryName: string;
    currentPage: number;
    pageSize: number;
    totalData: number;
    totalPages: number;
    loading: boolean;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    entryName,
    currentPage,
    pageSize,
    totalData,
    totalPages,
    loading,
    onPageChange,
    onPageSizeChange
}) => {
    const startIdx = ((currentPage - 1) * pageSize) + 1;
    const endIdx = Math.min(currentPage * pageSize, totalData);

    const paginationRange = [];
    const maxPages = Math.min(totalPages, 5);
    const startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPages, startPage + maxPages - 1);

    for (let i = startPage; i <= endPage; i++) {
        if (i >= 1) paginationRange.push(i);
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center h-40">
                <p className="text-gray-500">Refreshing {entryName} list...</p>
            </div>
        );
    }
    return (
        <>
            <div className="flex justify-between items-center p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className='border border-gray-300 rounded-lg px-3 py-1 bg-white focus:ring-blue-500 appearance-none cursor-pointer'
                    >
                        {[10, 20, 50, 100].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <span>entries</span>
                </div>
                <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold">{startIdx}</span> to{' '}
                    <span className="font-semibold">{endIdx}</span> of{' '}
                    <span className="font-semibold">{totalData}</span> {entryName}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    <div className="flex gap-1">
                        {paginationRange.map(pageNum => (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${currentPage === pageNum
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'border border-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                        {totalPages > endPage && (
                            <span className="px-4 py-2 text-gray-500">...</span>
                        )}
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition"
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </>
    );
}

export default Pagination;  