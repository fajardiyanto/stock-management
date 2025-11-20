export const formatDate = (dateStr: string) => {
  if (dateStr === '') return '';
  const date = new Date(dateStr);

  // convert to UTC+7 (Indonesia WIB)
  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  // format
  const formatted = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(wibDate)

  return formatted;
};