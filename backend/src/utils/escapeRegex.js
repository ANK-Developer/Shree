// User ke search text ko regex me safe banata hai (special characters escape)
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = escapeRegex;
