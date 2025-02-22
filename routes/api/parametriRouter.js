import express from "express";
const router = express.Router();
import parametriController from "../../controllers/parametriController.js";

router
  .route("/parametri")
  .get(parametriController.sendParametri)
  .post(parametriController.addParametar)
  .put(parametriController.addParametar);

router.route("/parametar/:uid").delete(parametriController.deleteParametar);

router.route("/updateUnitIdUrl").get(parametriController.getUpdateUnitIdUrl);

export default router;
