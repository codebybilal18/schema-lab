// Produces a canonical form of an email so that aliases of the same inbox are
// treated as one account: lowercased, the "+tag" suffix stripped, and for
// Gmail addresses the dots in the local part removed (Gmail ignores them).
export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1) {
    return trimmed;
  }

  const domain = trimmed.slice(atIndex + 1);
  let local = trimmed.slice(0, atIndex);

  const plusIndex = local.indexOf("+");
  if (plusIndex !== -1) {
    local = local.slice(0, plusIndex);
  }

  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
  }

  return `${local}@${domain}`;
}
