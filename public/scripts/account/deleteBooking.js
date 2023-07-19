document.addEventListener("DOMContentLoaded", function () {
  const deleteLinks = document.getElementsByClassName("deleteLink")
  for (const deleteLink of deleteLinks) {
    deleteLink.addEventListener("click", async function (e) {
      e.preventDefault()
      const id = deleteLink.getAttribute("id")
      const date = deleteLink.getAttribute("date")
      const court = deleteLink.getAttribute("court")
      const from = deleteLink.getAttribute("from")
      const until = deleteLink.getAttribute("until")

      const res = await fetch(`/booking/delete-booking/${id}/${date}/${court}/${from}/${until}`, {
        method: "DELETE"
      })
      const { message } = (await res.json())
      const notificationP = document.getElementById("notification")
      notificationP.innerText = message
      if (res.ok) {
        const rowTorRemove = document.getElementById(id)
        rowTorRemove.remove()
        notificationP.classList.add("success")
      } else {
        notificationP.classList.add("error")
      }
    })
  }
})
