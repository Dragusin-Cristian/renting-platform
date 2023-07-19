// Get all the input fields of type date
const dateInputs = document.querySelectorAll('input[type="date"]');

const today = new Date();
const minDate = today.toISOString().split('T')[0];
const maxDate = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

// Add event listeners to each input field
dateInputs.forEach(input => {
  input.setAttribute("min", minDate);
  input.setAttribute("max", maxDate);

  const formattedDate = today.toISOString().split("T")[0];
  input.value = formattedDate;


  input.addEventListener('change', async function (event) {
    const changedDate = event.target.value;
    // Loop through all the input fields and update their values
    dateInputs.forEach(dateInput => {
      dateInput.value = changedDate;
    })

    updateRentAnim()
  })
})
