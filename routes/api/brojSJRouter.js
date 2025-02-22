import express from "express";
import fileUpload from "express-fileupload";
const router = express.Router();
import brojSJController from "../../controllers/brojSJController.js";

router
  .route("/brojSJ")
  .get(brojSJController.getAllBrojSJ)
  .post(brojSJController.insertBrojSJ)
  .put(brojSJController.insertBrojSJ);

router
  .route("/brojSJ/csv")
  .get(brojSJController.exportToCsv)
  .post(fileUpload({ createParentPath: true, useTempFiles: true }), brojSJController.fromCsv)
  .put(fileUpload({ createParentPath: true, useTempFiles: true }), brojSJController.fromCsv);

router.route("/brojSJ/:uid").delete(brojSJController.deleteBrojSJ);

router.route("/pogodnosti").post(brojSJController.savePogodnostiForAllVrstaSJ);

router.route("/sj/:brojMISH").get(brojSJController.getMishData);

router.route("/brojSjWithVrstaNames").get(brojSJController.getAllWithVrstaNames);

router
  .route("/brojSJ/setVrstaParking")
  .post(brojSJController.saveParkingForAllVrstaSj)
  .put(brojSJController.saveParkingForAllVrstaSj);

export default router;
