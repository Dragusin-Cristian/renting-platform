const getErrorFlash = require("../utils/getErrorFlash")
const Day = require("../models/day")


exports.getHome = (req, res, _) => {
  res.render("home/index.ejs", {
    pageTitle: 'Sports center booking platform',
    name: req.session.user ? req.session.user.name : "",
    email: req.session.user ? req.session.user.email : "",
    errorMessage: getErrorFlash(req.flash("error"))
  })
}


exports.getBookingProgram = async (req, res, _) => {
  const { date } = req.params
  const program = []
  const day = await Day.findOne({ date: date })

  if (!day) {
    for (let courtIndex = 0; courtIndex < 3; courtIndex++) {
      program.push([{
        time: [],
        busy: false
      }])
      for (let i = 0; i < 10; i++) {
        program[courtIndex][0].time.push(`${i + 10}:00`)
      }
    }
    return res.status(200).send({ data: program })
  }

  const { courts } = day
  let courtIndex = 0
  for (const court of Object.values(courts)) {
    if (court) {
      program.push([])
      for (let i = 0; i < 10; i++) {
        const booking = court.get(`${i}`)
        //* is free:
        if (!booking) {
          //* it is free and not the first:
          if (program[courtIndex].length > 0) {
            //* check how the previous is set:
            const previous = program[courtIndex][program[courtIndex].length - 1]
            if (previous.busy === false) {
              previous.time.push(`${i + 10}:00`)
            } else {
              program[courtIndex].push({
                time: [`${i + 10}:00`],
                busy: false
              })
            }
          }
          //* it is free and the first:
          else {
            program[courtIndex].push({
              time: [`${i + 10}:00`],
              busy: false
            })
          }
        }
        //* is busy:
        else {
          //* it is busy for me (must be logged in):
          if (req.session.user && booking.toString() === req.session.user._id.toString()) {
            //* is busy for me and not the first:
            if (program[courtIndex].length > 0) {
              //* check how the previous is set:
              const previous = program[courtIndex][program[courtIndex].length - 1]
              if (previous.busy === "mine") {
                previous.time.push(`${i + 10}:00`)
              } else {
                program[courtIndex].push({
                  time: [`${i + 10}:00`],
                  busy: "mine"
                })
              }
            }
            //* is busy for me and the first:
            else {
              program[courtIndex].push({
                time: [`${i + 10}:00`],
                busy: "mine"
              })
            }
          }
          //* it is busy not for me:
          else {
            //* is busy not for me and not the first:
            if (program[courtIndex].length > 0) {
              //* check how the previous is set:
              const previous = program[courtIndex][program[courtIndex].length - 1]
              if (previous.busy === true) {
                previous.time.push(`${i + 10}:00`)
              } else {
                program[courtIndex].push({
                  time: [`${i + 10}:00`],
                  busy: true
                })
              }
            }
            //* is busy not for me and the first:
            else {
              program[courtIndex].push({
                time: [`${i + 10}:00`],
                busy: true
              })
            }
          }
        }
      }
    } else {
      program.push([{
        time: [],
        busy: false
      }])
      for (let i = 0; i < 10; i++) {
        program[courtIndex][0].time.push(`${i + 10}:00`)
      }
    }
    courtIndex++
  }

  res.status(200).send({ data: program })
}



exports.postBooking = async (req, res, _) => {

  if (!req.session.user) {
    return res.status(403).send({ message: "You have to be authenticated in order to make bookings" })
  }

  const { date, court, from, until } = req.body

  let today = new Date();
  const maxDate = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  today = today.toISOString().split('T')[0];

  if (date > maxDate) {
    return res.status(403).send({ message: "Renting with more than 2 days in advance is forbidden" })
  }
  if (from > until) {
    return res.status(403).send({ message: "The time interval is invalid" })
  }

  let day = await Day.findOne({ date: date.split('T')[0] })

  if (!day) {
    day = await Day.create({
      date: date,
      courts: {
        court1: null,
        court2: null,
        court3: null,
      }
    })
  }

  if (day.courts[`court${court}`]) {
    //* check if each hour is taken:
    for (let i = from; i < until; i++) {
      //* if yes, reutrn 403 
      if (day.courts[`court${court}`].get(`${i - 10}`)) {
        return res.status(403).send({ message: "Time interval not available" })
      }
      //* if not, set the hours:
      day.courts[`court${court}`].set(`${i - 10}`, req.session.user._id)
    }
  } else {
    day.courts[`court${court}`] = {}
    for (let i = from; i < until; i++) {
      day.courts[`court${court}`].set(`${i - 10}`, req.session.user._id)
    }
  }
  await req.user.addBooking(date, from, until, court)
  await day.save()
  res.status(200).send({ message: "Your booking was made" })
}


exports.deleteBooking = async (req, res, _) => {
  const { id: bookingId, date, court, from, until } = req.params

  try {
    //* delete the booking from user bookings array:
    await req.user.deleteBooking(bookingId)
    //* delete the booking from the day:
    const day = await Day.findOne({ date: date })
    const promisses = []
    for (let i = from; i < until; i++) {
      promisses.push(day.courts[`court${court}`].delete(`${i - 10}`))
    }
    await Promise.all(promisses)
    await day.save()
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Some error occured" })
  }

  res.status(200).send({ message: "Booking deleted" })
}
