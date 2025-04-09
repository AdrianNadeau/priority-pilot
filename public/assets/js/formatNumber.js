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
