// Shared display formats for student data, so every page shows them the same way.

// Roll no as shown to users: a single digit gets a leading 0 (1 -> 01); anything else is shown as entered.
export const formatRollNo = (rollNo) => {
  const clean = String(rollNo ?? '').trim();
  return /^\d$/.test(clean) ? `0${clean}` : clean;
};

// The page numbers a pager shows: three numbers that move with the current page (no dots, no last page).
// Page 1: 1 2 3, page 2: 2 3 4, page 3: 2 3 4, page 4: 3 4 5, page 5: 4 5 6 ...
// From page 3 on the current page is in the middle; page 1 stays visible only while you are on it.
export const pageItems = (page, pages) => {
  if (pages <= 3) return Array.from({ length: pages }, (_, i) => i + 1);
  const start = Math.min(page === 1 ? 1 : Math.max(2, page - 1), pages - 2);
  return [start, start + 1, start + 2];
};

// A person's name with a capital at the start of each word: "ravi kumar" / "RAVI KUMAR" -> "Ravi Kumar".
export const titleName = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
  .replace(/(^|[\s-])(\S)/g, (m, sep, ch) => sep + ch.toUpperCase());
