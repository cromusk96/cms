import express from "express";
import osuncanostController from "../../controllers/osuncanostController.js";
const router = express.Router();

router
  .route("/osuncanost")
  .get(osuncanostController.getAll)
  .post(osuncanostController.update)
  .put(osuncanostController.update);

router
  .route("/osuncanost/:uid")
  .delete(osuncanostController.markDeleted);

export default router;