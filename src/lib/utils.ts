export const clx = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(" ");

/** Bỏ dấu tiếng Việt: "Tối ưu ảnh" -> "Toi uu anh" */
export const removeDiacritics = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

/** Tạo slug URL từ tiêu đề: "Tối ưu ảnh!" -> "toi-uu-anh" */
export const slugify = (str: string) =>
  removeDiacritics(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const formatDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {},
) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...options,
  });
};

export const todayVN = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
