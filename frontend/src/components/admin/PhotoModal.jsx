import { useEffect } from "react";
import { fullName, photoSrc } from "../../utils/format";

// Original file hi download hoti hai (koi resize/compress nahi), isliye quality HD rehti hai
const download = async (url, name) => {
  const fileName = `${name}${url.match(/\.[a-z0-9]+$/i)?.[0] || ".jpg"}`;
  try {
    const blob = await (await fetch(url)).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank", "noopener"); // CORS block ho to naye tab me original khul jayegi
  }
};

const PhotoModal = ({ member, onClose }) => {
  const src = photoSrc(member.photoUrl);
  const name = fullName(member);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="truncate font-semibold text-royal-900">{name}</p>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <img src={src} alt={name} className="max-h-[60vh] w-full rounded-xl bg-royal-100 object-contain" />
        <button
          onClick={() => download(src, name)}
          className="mt-4 w-full rounded-xl bg-royal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-royal-700"
        >
          Download Photo
        </button>
      </div>
    </div>
  );
};

export default PhotoModal;
