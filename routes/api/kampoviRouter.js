import express from "express";
const router = express.Router();
import kampoviController from "../../controllers/kampoviController.js";
import fileUpload from "express-fileupload";

router
  .route("/kampovi")
  .get(kampoviController.getAllKampovi)
  .post(kampoviController.insertKamp)
  .put(kampoviController.insertKamp);

router
  .route("/kamp")
  .get(kampoviController.getKamp)
  .post(kampoviController.insertKamp)
  .put(kampoviController.insertKamp);

router.route("/kamp/:uid").get(kampoviController.getKamp).delete(kampoviController.deleteKamp);

router
  .route("/geojson")
  .post(fileUpload(), kampoviController.recieveGeojsonFile)
  .put(fileUpload(), kampoviController.recieveGeojsonFile);

router
  .route("/revertGeojson")
  .post(kampoviController.revertToBackupGeojson)
  .put(kampoviController.revertToBackupGeojson);

router.route("/kampovi/default").get(kampoviController.getDefaultKamp);

export default router;
