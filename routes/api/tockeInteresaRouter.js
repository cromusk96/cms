import express from "express";
const router = express.Router();
import tockeInteresaController from "../../controllers/tockeInteresaController.js";

router
  .route("/tockeInteresa")
  .get(tockeInteresaController.getAllTockeInteresa)
  .post(tockeInteresaController.insertTockaInteresa)
  .put(tockeInteresaController.insertTockaInteresa);

router.route("/tockaInteresa/:uid").delete(tockeInteresaController.deleteTockaInteresa);

router.route("/vrsteTocki").get(tockeInteresaController.getAllVrste);

router.route("/setGroupForIcon").post(tockeInteresaController.setGroupToAll).put(tockeInteresaController.setGroupToAll);

router.route("/reorderPoi").post(tockeInteresaController.reorder).put(tockeInteresaController.reorder);

export default router;
