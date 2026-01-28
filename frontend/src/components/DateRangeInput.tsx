import { useState } from "react";
import { Calendar } from "lucide-react";
import { DateRange, Range, RangeKeyDict } from "react-date-range";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface DateRangeInputProps {
    ranges: Range[];
    onChange: (item: RangeKeyDict) => void;
}

const DateRangeInput = ({ ranges, onChange }: DateRangeInputProps) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            {open && (
                <div
                    className="fixed inset-0 z-10 bg-transparent"
                    onClick={() => setOpen(false)}
                />
            )}

            <div
                className={`flex items-center w-full px-4 py-2.5 bg-white border rounded-xl transition-all duration-200 cursor-pointer group
                    ${open ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-gray-200 hover:border-blue-400 hover:shadow-sm'}`}
                onClick={() => setOpen(!open)}
            >
                <div className="flex-1 text-sm font-medium text-gray-700 truncate">
                    {`${format(ranges[0].startDate ?? new Date(), "dd MMM, yyyy", { locale: id })} - ${format(
                        ranges[0].endDate ?? new Date(),
                        "dd MMM, yyyy",
                        { locale: id }
                    )}`}
                </div>
                <Calendar
                    className={`ml-2 text-gray-400 transition-colors duration-200 ${open ? 'text-blue-500' : 'group-hover:text-blue-500'}`}
                    size={18}
                />
            </div>

            {open && (
                <div className="absolute right-0 z-20 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <DateRange
                        editableDateInputs
                        moveRangeOnFirstSelection={false}
                        ranges={ranges}
                        maxDate={new Date()}
                        onChange={onChange}
                        locale={id}
                        rangeColors={['#3b82f6']}
                        showDateDisplay={false}
                    />
                </div>
            )}
        </div>
    );
};

export default DateRangeInput;