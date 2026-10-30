import { formatDateOnly, fullName, photoSrc } from "./format";

// A4 @96dpi
const PAGE_W = 794;
const PAGE_H = 1123;
const PAD = 24;
const COLS = 2;
const ROWS = 6;
const GAP = 10;
const PER_PAGE = COLS * ROWS;
const FONT = "'Nirmala UI','Noto Sans Devanagari','Segoe UI',Arial,sans-serif";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Photo ko data URL banate hain taaki canvas me CORS ki wajah se na toote
const toDataUrl = async (path) => {
  if (!path) return "";
  try {
    const blob = await (await fetch(photoSrc(path))).blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
};

const row = (label, value) =>
  `<div style="display:flex;gap:4px;line-height:1.35"><span style="color:#6b7280;flex:0 0 62px">${label}</span><span style="font-weight:600;color:#111827;word-break:break-word">${esc(value) || "—"}</span></div>`;

const card = (m, sr, photo) => {
  const cardW = (PAGE_W - PAD * 2 - GAP * (COLS - 1)) / COLS;
  const cardH = (PAGE_H - PAD * 2 - 30 - GAP * (ROWS - 1)) / ROWS;
  const initial = esc((m.name || "?").trim()[0] || "?");
  const photoHtml = photo
    ? `<div style="width:78px;height:96px;border-radius:6px;background:#e5e7eb url('${photo}') center/cover no-repeat"></div>`
    : `<div style="width:78px;height:96px;border-radius:6px;background:#e0e7ff;color:#3730a3;font-size:28px;font-weight:700;display:flex;align-items:center;justify-content:center">${initial}</div>`;
  const address = [m.address, m.pincode].filter(Boolean).join(" - ");
  return `<div style="box-sizing:border-box;width:${cardW}px;height:${cardH}px;border:1px solid #cbd5e1;border-radius:8px;padding:8px;display:flex;gap:8px;overflow:hidden;font-size:10.5px;background:#fff">
    <div style="flex:0 0 78px;text-align:center">
      <div style="font-weight:700;font-size:12px;color:#1e3a8a;margin-bottom:4px">#${sr}</div>
      ${photoHtml}
      <div style="margin-top:4px;font-size:9px;font-weight:700;color:${m.memberStatus === "ACTIVE" ? "#15803d" : "#b91c1c"}">${m.memberStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE"}</div>
    </div>
    <div style="flex:1;min-width:0;overflow:hidden">
      ${row("Name", fullName(m))}
      ${row("Father/Hus.", m.fatherHusbandName)}
      ${row("Mobile", m.mobileNumber)}
      ${row("DOB", formatDateOnly(m.birthDate))}
      ${row("Type", m.memberType)}
      ${row("Aadhaar", m.aadharNumber)}
      ${row("Address", address)}
    </div>
  </div>`;
};

const page = (cards, title, pageNo, pages) =>
  `<div style="box-sizing:border-box;width:${PAGE_W}px;height:${PAGE_H}px;padding:${PAD}px;background:#fff;font-family:${FONT};position:relative">
    <div style="height:30px;display:flex;justify-content:space-between;align-items:flex-start;font-size:12px;color:#1e3a8a;font-weight:700"><span>${esc(title)}</span><span style="color:#6b7280;font-weight:400">Page ${pageNo} / ${pages}</span></div>
    <div style="display:grid;grid-template-columns:repeat(${COLS},1fr);gap:${GAP}px">${cards.join("")}</div>
  </div>`;

// members: export API ka data, label: "All" | "Active" | "Inactive"
export const downloadMembersPdf = async (members, label) => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  const photos = await Promise.all(members.map((m) => toDataUrl(m.photoUrl)));
  const pages = Math.max(Math.ceil(members.length / PER_PAGE), 1);
  const date = new Date().toLocaleDateString("en-IN");

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0";
  document.body.appendChild(host);

  try {
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    for (let p = 0; p < pages; p++) {
      const start = p * PER_PAGE;
      const cards = members.slice(start, start + PER_PAGE).map((m, i) => card(m, start + i + 1, photos[start + i]));
      host.innerHTML = page(cards, `${label} Members (${members.length}) - ${date}`, p + 1, pages);
      const canvas = await html2canvas(host.firstElementChild, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      if (p > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297);
    }
    pdf.save(`members-${label.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    host.remove();
  }
};
