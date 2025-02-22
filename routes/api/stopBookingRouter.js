import express from "express";
const router = express.Router();
import stopBookingController from "../../controllers/stopBookingController.js";

router
  .route("/stopBookings")
  .get(stopBookingController.getStopBookings)
  .post(stopBookingController.saveStopBooking)
  .put(stopBookingController.saveStopBooking);

router
  .route("/stopBooking/:uid")
  .delete(stopBookingController.deleteStopBooking);

export default router;