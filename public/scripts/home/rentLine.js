const red = "#D84805", green = "#B9DA3B", blue = "#43A1DF";
const dateInputProgram = document.getElementById("dateProgram")
const rentLinesContainer = document.getElementById("rentLinesContainer")

const cachedSchedule = {}

const fetchAndCacheBookingProgram = async (date) => {
  const res = await fetch(`/booking/program/${date}`)
  const data = await res.json()
  cachedSchedule[date] = data.data
}

const updateRentAnim = async () => {
  const date = dateInputProgram.value

  if (!cachedSchedule[date]) {
    await fetchAndCacheBookingProgram(date)
  }

  $(document).ready(function () {

    rentLinesContainer.textContent = ""

    cachedSchedule[date].map((program, i) => {
      const container = $("#rentLinesContainer")

      const rentLineContainerDiv = document.createElement("div")
      rentLineContainerDiv.classList.add("rentLineContainer")

      const courtTitleP = document.createElement("p")
      courtTitleP.classList.add("courtTitle")
      courtTitleP.innerText = "Court " + (i + 1)

      const line = document.createElement("div")
      line.classList.add("rentLine")

      $(container).append(rentLineContainerDiv)
      $(rentLineContainerDiv).append(courtTitleP)
      $(rentLineContainerDiv).append(line)

      const timeUnit = ($(container).width() - 40) / (program.length);

      for (const prog of program) {
        var cont = document.createElement("div");
        var Hcont = document.createElement("div");
        var hour = document.createElement("p");
        var unitColor = document.createElement("div");
        line.append(cont);
        $(cont).append(Hcont);
        $(cont).append(unitColor);
        $(Hcont).append(hour);
        Hcont.style.display = "flex"
        $(hour).text(prog.time[0]);
        hour.classList.add("rentLineHour")

        if (prog.busy == true) {
          for (var j = 0; j < prog.time.length; j++) {
            unitColor.style.backgroundColor = red;
          }
        } else if (prog.busy == false) {
          for (var j = 0; j < prog.time.length; j++) {
            unitColor.style.backgroundColor = green;
          }
        } else if (prog.busy == "mine") {
          for (var j = 0; j < prog.time.length; j++) {
            unitColor.style.backgroundColor = blue;
          }
        }

        $(unitColor).animate({ width: timeUnit + "px" }, 2000);
        //! Here try to find a way to make it relative in % for css, not static in px from js
        // $(unitColor).animate({ width: 100 / program.length + "%" }, 2000);
        $(unitColor).css({ height: "14px" });
      }

      const lastHour = document.createElement("p");
      lastHour.classList.add("rentLineHour")
      $(lastHour).text("20:00");
      lastHour.style.width = "100%";
      lastHour.style.textAlign = "right";
      $(line).find("div:last-child").find("div:first-child").append(lastHour)
    })
  })
}

updateRentAnim()
