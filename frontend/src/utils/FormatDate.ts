export const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) {
        return "";
    }

    let date: Date;
    try {
        date = new Date(dateStr);
    } catch (error) {
        return "Invalid Date";
    }

    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }

    const formatted = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);

    return formatted;
};

export const formatDateRawUTC = (dateStr?: string | null): string => {
    if (!dateStr) return "";

    const cleaned = dateStr.replace("Z", "").split(".")[0];

    const [date, time] = cleaned.split("T");
    if (!date || !time) return "Invalid Date";

    const [year, month, day] = date.split("-");
    const [hour, minute] = time.split(":");

    return `${day} ${new Intl.DateTimeFormat("id-ID", {
        month: "short",
    }).format(new Date(`${year}-${month}-01`))} ${year} ${hour}:${minute}`;
};
