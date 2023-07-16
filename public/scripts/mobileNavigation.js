document.addEventListener("DOMContentLoaded", function () {
  const burger = document.getElementById("burger")
  const mobileDrawer = document.getElementById("rightHalf")

  burger.addEventListener("click", function () {
    mobileDrawer.classList.toggle("drawerShow")
  })
})
