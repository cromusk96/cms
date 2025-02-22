import express from "express";
const router = express.Router();
import paymentGwController from "../../controllers/paymentGwController.js";

router.route("/paymentGws").get(paymentGwController.getAllPaymentGws);

router
  .route("/payGwPostavke")
  .get(paymentGwController.getPayGwPostavke)
  .post(paymentGwController.updatePayGwPostavke)
  .put(paymentGwController.updatePayGwPostavke);

export default router;
