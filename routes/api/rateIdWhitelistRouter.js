import express from "express";
const router = express.Router();
import rateIdWhitelistController from "../../controllers/rateIdWhitelistController.js";

router
  .route("/rateIdWhitelist")
  .get(rateIdWhitelistController.getAll)
  .post(rateIdWhitelistController.insertOrUpdate)
  .put(rateIdWhitelistController.insertOrUpdate);

router.route("/rateIdWhitelist/:uid").delete(rateIdWhitelistController.markDeleted);

export default router;
