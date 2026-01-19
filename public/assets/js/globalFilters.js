// Global Filter Initialization Script
// This script should be included in the layout template to initialize filter values on all pages

document.addEventListener("DOMContentLoaded", function () {
  // Function to get filter values from the server or session storage
  function initializeGlobalFilters() {
    // Get values from server-side template variables if available
    const serverFromDate =
      '<%= typeof currentFromDate !== "undefined" ? currentFromDate : "" %>';
    const serverToDate =
      '<%= typeof currentToDate !== "undefined" ? currentToDate : "" %>';

    // Store in session storage if not already there
    if (serverFromDate && !sessionStorage.getItem("globalFilterStart")) {
      sessionStorage.setItem("globalFilterStart", serverFromDate);
    }
    if (serverToDate && !sessionStorage.getItem("globalFilterEnd")) {
      sessionStorage.setItem("globalFilterEnd", serverToDate);
    }

    // Update any date inputs on the current page if they exist
    const fromDateInput = document.getElementById("from_date");
    const toDateInput = document.getElementById("to_date");

    if (fromDateInput) {
      fromDateInput.value =
        sessionStorage.getItem("globalFilterStart") || serverFromDate || "";
    }
    if (toDateInput) {
      toDateInput.value =
        sessionStorage.getItem("globalFilterEnd") || serverToDate || "";
    }
  }

  // Function to apply global filters to any page-specific data
  function applyGlobalFiltersToPage() {
    const filterValues = getGlobalFilterValues();

    // Dispatch custom event for pages that need to respond to filter changes
    const filterEvent = new CustomEvent("globalFiltersChanged", {
      detail: filterValues,
    });
    document.dispatchEvent(filterEvent);
  }

  // Global function to get current filter values
  function getGlobalFilterValues() {
    return {
      fromDate:
        sessionStorage.getItem("globalFilterStart") ||
        (typeof currentFromDate !== "undefined" ? currentFromDate : ""),
      toDate:
        sessionStorage.getItem("globalFilterEnd") ||
        (typeof currentToDate !== "undefined" ? currentToDate : ""),
    };
  }

  // Function to navigate with current filters
  function navigateWithFilters(url) {
    const filters = getGlobalFilterValues();
    const urlObj = new URL(url, window.location.origin);

    if (filters.fromDate) {
      urlObj.searchParams.set("from_date", filters.fromDate);
    }
    if (filters.toDate) {
      urlObj.searchParams.set("to_date", filters.toDate);
    }

    window.location.href = urlObj.toString();
  }

  // Make functions globally available
  window.getGlobalFilterValues = getGlobalFilterValues;
  window.navigateWithFilters = navigateWithFilters;
  window.applyGlobalFiltersToPage = applyGlobalFiltersToPage;

  // Initialize filters on page load
  initializeGlobalFilters();

  // Apply filters to current page
  setTimeout(applyGlobalFiltersToPage, 100);
});
