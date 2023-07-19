const express = require("express")

const homeController = require('../controllers/home');

const router = express.Router();

router.get('/', homeController.getHome)

router.get("/booking/program/:date", homeController.getBookingProgram)
router.post("/booking/post-booking", homeController.postBooking)
router.delete("/booking/delete-booking/:id/:date/:court/:from/:until", homeController.deleteBooking)

module.exports = router;
