import express from "express";
import fileUpload from "express-fileupload";
const router = express.Router();
import vrstaSJController from "../../controllers/vrstaSJController.js";

router
  .route("/vrstaSJ")
  .get(vrstaSJController.getAllVrstaSJ)
  .post(vrstaSJController.insertVrstaSJ)
  .put(vrstaSJController.insertVrstaSJ);

router.route("/vrstaSJ/:uid").delete(vrstaSJController.deleteVrstaSJ);

router
  .route("/vrstaSJ/csv")
  .get(vrstaSJController.exportToCsv)
  .post(fileUpload({ createParentPath: true, useTempFiles: true }), vrstaSJController.fromCsv)
  .put(fileUpload({ createParentPath: true, useTempFiles: true }), vrstaSJController.fromCsv);

router.route("vrstasj").get(vrstaSJController.getAllVrstaSJOznake);

router.route("/reorderVrstaSj").post(vrstaSJController.reorderVrstaSj).put(vrstaSJController.reorderVrstaSj);

export default router;
