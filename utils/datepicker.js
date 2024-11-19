const datepicker = require("js-datepicker");

// Initialize datepicker on the input element with ID 'start_date'
const picker = datepicker("#start_date", {
  formatter: (input, date, instance) => {
    const value = date.toLocaleDateString("en-CA"); // Format date as YYYY-MM-DD
    input.value = value;
  },
});

// Initialize datepicker on the input element with ID 'end_date'
const pickerEnd = datepicker("#end_date", {
  formatter: (input, date, instance) => {
    const value = date.toLocaleDateString("en-CA"); // Format date as YYYY-MM-DD
    input.value = value;
  },
});
