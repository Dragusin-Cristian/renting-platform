const priceSpan = document.getElementById("price")

const HOURLY_RATE = 10

const calculatePrice = () => {
  const from = fromInput.value
  const until = untilInput.value
  const price = (until - from) * HOURLY_RATE
  priceSpan.innerText = price
}

untilInput.addEventListener("change", calculatePrice)
fromInput.addEventListener("change", calculatePrice)
