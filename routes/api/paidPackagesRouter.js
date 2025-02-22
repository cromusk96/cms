import express from "express";
const router = express.Router();
import paidPackagesController from "../../controllers/paidPackagesController.js";

router.route("/paidPackages").get(paidPackagesController.sendPaidPackages);

router.route("/isPaid/:packageName").get(paidPackagesController.isPaid);

export default router;
