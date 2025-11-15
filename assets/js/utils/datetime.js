export const pad = (value) => String(value).padStart(2, "0");

export const ymd = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
};

export const formatDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
