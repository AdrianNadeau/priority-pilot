// Helper function to insert valid date
function insertValidDate(date) {
  return date ? moment.tz(date, "YYYY-MM-DD", "UTC") : null;
}
const formatCost = (cost) => {
  if (cost === null || cost === undefined) {return "0";}
  if (cost >= 1_000_000_000) {return `${(cost / 1_000_000_000).toFixed(1)}B`;}
  if (cost >= 1_000_000) {return `${(cost / 1_000_000).toFixed(1)}M`;}
  if (cost >= 1_000) {return `${(cost / 1_000).toFixed(1)}K`;}
  return cost.toString();
};

/**
 * Format a numeric string with thousands commas, preserving a decimal portion.
 * e.g. "1234567.89" -> "1,234,567.89"
 */
function formatWithCommas(val) {
  const str = String(val).replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? parts[0] + '.' + parts[1] : parts[0];
}

/**
 * Strip commas from a value and return the plain numeric string.
 * e.g. "1,234,567" -> "1234567"
 */
function parseCommaNumber(val) {
  return String(val).replace(/,/g, '');
}

/**
 * Attach live comma formatting and numeric-only validation to a single input element.
 * Blocks non-numeric keystrokes and reformats the display value on each input event.
 * The raw numeric value (without commas) is always available via parseCommaNumber(el.value).
 */
function attachCommaInput(el) {
  if (!el || el.dataset.commaAttached) return;
  el.dataset.commaAttached = 'true';

  // Block non-numeric keys (allow: backspace, delete, tab, escape, enter, decimal, arrows, ctrl/meta)
  el.addEventListener('keydown', function (e) {
    const allowed = [8, 9, 13, 27, 46, 110, 190];
    const isArrow = e.keyCode >= 37 && e.keyCode <= 40;
    const isDigit = (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105);
    const isCtrl = e.ctrlKey || e.metaKey;
    if (!allowed.includes(e.keyCode) && !isArrow && !isDigit && !isCtrl) {
      e.preventDefault();
    }
  });

  // Reformat with commas on each input event
  el.addEventListener('input', function () {
    const pos = this.selectionStart;
    const oldLen = this.value.length;
    this.value = formatWithCommas(this.value);
    // Adjust cursor position to account for added/removed commas
    const newLen = this.value.length;
    this.setSelectionRange(pos + (newLen - oldLen), pos + (newLen - oldLen));
  });
}

/**
 * Auto-attach comma formatting to all inputs with class "comma-input" or
 * data-format="comma" within an optional root element (defaults to document).
 */
function initCommaInputs(root) {
  const scope = root || document;
  scope.querySelectorAll('input.comma-input, input[data-format="comma"]').forEach(attachCommaInput);
}

/**
 * Legacy inline-handler wrapper used by oninput="formatNumberWithCommas(this)".
 * Reformats the input element's value with commas in place.
 */
function formatNumberWithCommas(el) {
  if (!el) return;
  const pos = el.selectionStart;
  const oldLen = el.value.length;
  el.value = formatWithCommas(el.value);
  const newLen = el.value.length;
  try { el.setSelectionRange(pos + (newLen - oldLen), pos + (newLen - oldLen)); } catch(e) {}
}

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', function () { initCommaInputs(); });
