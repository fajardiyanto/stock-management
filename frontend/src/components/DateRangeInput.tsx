import { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import { DateRange, Range, RangeKeyDict } from "react-date-range";
import { format, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface DateRangeInputProps {
    ranges: Range[];
    onChange: (item: RangeKeyDict) => void;
}

interface DatePreset {
    label: string;
    range: () => { startDate: Date; endDate: Date };
}

const DateRangeInput = ({ ranges, onChange }: DateRangeInputProps) => {
    const [open, setOpen] = useState(false);
    const [tempRanges, setTempRanges] = useState<Range[]>(ranges);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            setTempRanges(ranges);
        }
    }, [open, ranges]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const presets: DatePreset[] = [
        {
            label: "Hari ini",
            range: () => ({
                startDate: startOfDay(new Date()),
                endDate: endOfDay(new Date()),
            }),
        },
        {
            label: "7 Hari Terakhir",
            range: () => ({
                startDate: subDays(new Date(), 6),
                endDate: new Date(),
            }),
        },
        {
            label: "30 Hari Terakhir",
            range: () => ({
                startDate: subDays(new Date(), 29),
                endDate: new Date(),
            }),
        },
        {
            label: "90 Hari Terakhir",
            range: () => ({
                startDate: subDays(new Date(), 89),
                endDate: new Date(),
            }),
        },
    ];

    const handlePresetClick = (preset: DatePreset) => {
        const { startDate, endDate } = preset.range();
        setTempRanges([
            {
                startDate,
                endDate,
                key: "selection",
            },
        ]);
    };

    const handleApply = () => {
        onChange({ selection: tempRanges[0] });
        setOpen(false);
    };

    const handleCancel = () => {
        setOpen(false);
        setTempRanges(ranges);
    };

    const isPresetActive = (preset: DatePreset) => {
        const { startDate, endDate } = preset.range();
        const currentStart = tempRanges[0].startDate;
        const currentEnd = tempRanges[0].endDate;

        if (!currentStart || !currentEnd) return false;

        return (
            isSameDay(currentStart, startDate) &&
            isSameDay(currentEnd, endDate)
        );
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                className={`flex items-center w-full px-4 py-2.5 bg-white border rounded-xl transition-all duration-200 cursor-pointer group
                    ${open ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-gray-200 hover:border-blue-400 hover:shadow-sm'}`}
                onClick={() => setOpen(!open)}
            >
                <div className="flex-1 text-sm font-medium text-gray-700 truncate">
                    {`${format(ranges[0].startDate ?? new Date(), "d MMM yyyy", { locale: id })} - ${format(
                        ranges[0].endDate ?? new Date(),
                        "d MMM yyyy",
                        { locale: id }
                    )}`}
                </div>
                <Calendar
                    className={`ml-2 text-gray-400 transition-colors duration-200 ${open ? 'text-blue-500' : 'group-hover:text-blue-500'}`}
                    size={18}
                />
            </div>

            {open && (
                <div className="absolute right-0 z-20 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right flex flex-col md:flex-row">
                    <div className="w-full md:w-48 bg-white border-b md:border-b-0 md:border-r border-gray-100 p-4 flex flex-col gap-2">
                        <span className="text-sm font-semibold text-gray-900 mb-2 block">
                            Pilih Tanggal
                        </span>
                        {presets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handlePresetClick(preset)}
                                className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isPresetActive(preset)
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                        <span className="text-sm font-semibold text-gray-900 mt-auto pt-4 block md:hidden">
                            Pilih Tanggal Custom
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <div className="p-2">
                            <DateRange
                                editableDateInputs={true}
                                moveRangeOnFirstSelection={false}
                                ranges={tempRanges}
                                maxDate={new Date()}
                                onChange={(item) => setTempRanges([item.selection])}
                                locale={id}
                                rangeColors={['#3b82f6']}
                                months={2}
                                direction="horizontal"
                                showDateDisplay={false}
                                showMonthAndYearPickers={false}
                            />
                        </div>

                        <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-100 bg-white">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeInput;