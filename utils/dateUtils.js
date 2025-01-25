// utils/dateUtils.js
// function formatCost(input) {
//   // Remove non-numeric characters except for the decimal point
//   let value = input.value.replace(/[^0-9.]/g, "");

//   // Split the value into integer and decimal parts
//   const parts = value.split(".");
//   const integerPart = parts[0];
//   const decimalPart = parts.length > 1 ? "." + parts[1] : "";

//   // Format the integer part with commas
//   const formattedIntegerPart = integerPart.replace(
//     /\B(?=(\d{3})+(?!\d))/g,
//     ",",
//   );
//   // Combine the formatted integer part with the decimal part
//   input.value = formattedIntegerPart + decimalPart;
// }
// const insertValidDate = (dateString) => {
//   if (!dateString) return null;
//   const date = new Date(dateString);
//   return isNaN(date.getTime()) ? null : date;
// };

// const formatDate = (dateString) => {
//   if (!dateString) return "";
//   const options = { month: "short", day: "numeric", year: "numeric" };
//   const date = new Date(dateString);
//   return date.toLocaleDateString("en-US", options);
// };
// const convertToNumber = (value) => {
//   if (typeof value === "number") return value;
//   if (typeof value === "string")
//     return parseFloat(value.replace(/,/g, "")) || 0;
//   return 0;
// };

// modules.exports = {
//   insertValidDate,
//   formatDate,
//   convertToNumber,
//   formatCost,
// };
function formatNumberWithCommas(input) {
  // Remove non-numeric characters
  let value = input.value.replace(/\D/g, "");

  // Format the number with commas
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Set the formatted value back to the input
  input.value = value;
}
// Helper function to insert valid date
function insertValidDate(date) {
  return date ? moment.tz(date, "YYYY-MM-DD", "UTC") : null;
}
const formatCost = (cost) => {
  if (cost === null || cost === undefined) return "0";
  if (cost >= 1_000_000_000) return `${(cost / 1_000_000_000).toFixed(1)}B`;
  if (cost >= 1_000_000) return `${(cost / 1_000_000).toFixed(1)}M`;
  if (cost >= 1_000) return `${(cost / 1_000).toFixed(1)}K`;
  return cost.toString();
};
