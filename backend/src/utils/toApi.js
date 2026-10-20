// Prisma rows me "id" hota hai, frontend "_id" expect karta hai (Mongo ke time se). Har level par id -> _id.
const toApi = (value) => {
  if (Array.isArray(value)) return value.map(toApi);
  if (value === null || typeof value !== "object" || value instanceof Date) return value;

  const out = {};
  for (const [key, v] of Object.entries(value)) out[key === "id" ? "_id" : key] = toApi(v);
  return out;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidId = (id) => typeof id === "string" && UUID_RE.test(id);

module.exports = { toApi, isValidId };
