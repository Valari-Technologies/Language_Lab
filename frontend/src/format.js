// Shared display formats for student data, so every page shows them the same way.

// Roll no as shown to users: a single digit gets a leading 0 (1 -> 01); anything else is shown as entered.
export const formatRollNo = (rollNo) => {
  const clean = String(rollNo ?? '').trim();
  return /^\d$/.test(clean) ? `0${clean}` : clean;
};

// The page numbers a pager shows: all of them for 5 pages or fewer, else a window of three that starts at the current
// page and moves on with it (page 1: 1 2 3 … 6, page 2: 2 3 4 … 6, page 3: 3 4 5 6), then the last page.
export const pageItems = (page, pages) => {
  if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(page, pages - 2));
  const items = [start, start + 1, start + 2];
  if (start + 2 < pages - 1) items.push('...', pages);
  else if (start + 2 === pages - 1) items.push(pages);
  return items;
};

// A person's name with a capital at the start of each word: "ravi kumar" / "RAVI KUMAR" -> "Ravi Kumar".
export const titleName = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
  .replace(/(^|[\s-])(\S)/g, (m, sep, ch) => sep + ch.toUpperCase());
