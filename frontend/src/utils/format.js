import { FILE_BASE_URL } from "../services/api";

export const photoSrc = (path) => (path ? `${FILE_BASE_URL}${path}` : "");

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Sirf date wali values (birthday/anniversary) UTC midnight par store hain, isliye UTC me format karte hain
export const formatDateOnly = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

export const fullName = (m) => [m?.name, m?.surname].filter(Boolean).join(" ");

export const initials = (m) =>
  fullName(m)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
