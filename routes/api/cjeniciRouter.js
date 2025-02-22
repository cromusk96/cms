import express from "express";
const router = express.Router();
import cjeniciController from "../../controllers/cjeniciController.js";

router
  .route("/cjenici")
  .get(cjeniciController.getAllCjenici)
  .post(cjeniciController.insertOrUpdateCjenik)
  .put(cjeniciController.insertOrUpdateCjenik);

export default router;
