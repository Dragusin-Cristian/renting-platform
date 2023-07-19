const form = document.getElementById("bookingForm")
const fromInput = document.getElementById("from")
const untilInput = document.getElementById("until");
const dateInput = document.getElementById("dateForm")
const courtInput = document.getElementById("courtForm")
const bookingResponseP = document.getElementById("bookingFormResponse")

form.addEventListener("submit", async function (event) {
  event.preventDefault()

  const fromTime = fromInput.value
  const untilTime = untilInput.value
  const date = dateInput.value
  const court = courtInput.value

  if (untilTime <= fromTime) {
    return alert("The selected time until is earlier than the time from. Please select a valid range.")
  }

  const res = await fetch("/booking/post-booking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: parseInt(fromTime),
      until: parseInt(untilTime),
      date: date,
      court: court
    })
  })
  const { message } = await res.json()
  bookingResponseP.innerText = message
  //* no matter the response, we want to update the program after submit:
  //* udpate the cached value:
  await fetchAndCacheBookingProgram(date)
  updateRentAnim()
  if (res.ok) {
    bookingResponseP.classList.remove("error")
    bookingResponseP.classList.add("success")
  } else {
    bookingResponseP.classList.remove("success")
    bookingResponseP.classList.add("error")
  }
})
