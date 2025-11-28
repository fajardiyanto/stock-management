export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) {
    return '';
  }

  let date: Date;
  try {
    date = new Date(dateStr);
  } catch (error) {
    return 'Invalid Date';
  }

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const formatted = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(date);

  return formatted;
};