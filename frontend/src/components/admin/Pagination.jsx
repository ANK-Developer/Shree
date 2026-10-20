// Current page ke aas-paas ke pages dikhata hai: 1 ... 4 5 [6] 7 8 ... 20
const getPages = (page, totalPages) => {
  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  return pages;
};

const btn = "min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed";

const Pagination = ({ page, limit, total, totalPages, onChange }) => {
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
      <p className="text-sm text-gray-500">
        Showing {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-1">
        <button className={`${btn} hover:bg-royal-100`} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Prev
        </button>
        {getPages(page, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`${btn} ${p === page ? "bg-royal-600 text-white" : "hover:bg-royal-100"}`}
            >
              {p}
            </button>
          ),
        )}
        <button className={`${btn} hover:bg-royal-100`} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
