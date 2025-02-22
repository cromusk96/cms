import express from "express";
const router = express.Router();
import objektiController from "../../controllers/objektiController.js";

router
  .route("/objekti")
  .get(objektiController.getObjekti)
  .post(objektiController.insertObjekt)
  .put(objektiController.insertObjekt);

router.route("/objekt/:uid").delete(objektiController.deleteObjekt);

router.route("/vrsteObjekata").get(objektiController.getVrsteObjekata);

router.route("/objektVlasnik").get(objektiController.getObjektVlasnik);

router.route("/getOwnedObjects").get(objektiController.getOwnedObjects);

router.route("/sviObjekti").get(objektiController.getAllObjekti);

export default router;
