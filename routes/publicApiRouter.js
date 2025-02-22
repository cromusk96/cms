import express from "express";
const router = express.Router();
import objektiController from "../controllers/objektiController.js";
import kampoviController from "../controllers/kampoviController.js";
import paymentGwController from "../controllers/paymentGwController.js";
import ostalePostavkeController from "../controllers/ostalePostavkeController.js";
import prijevodiCmsController from "../controllers/prijevodiCmsController.js";
import brojSJController from "../controllers/brojSJController.js";
import imageController from "../controllers/imageController.js";
import stopBookingController from "../controllers/stopBookingController.js";
import generalTranslationsController from "../controllers/generalTranslationsController.js";

router.route("/radnoVrijemeObjekta").get(objektiController.getRadnoVrijeme);

router.route("/:grupacija/getAll").get(kampoviController.getKampoviList);

router.route("/getPrivatePayGwData").get(paymentGwController.getPrivatePayGwData);

router.route("/getOstalePostavke").get(ostalePostavkeController.publicGet);

router.route("/getCmsPrijevodi").get(prijevodiCmsController.getAll);

router.route("/getBrojSjByMapId").get(brojSJController.getBrojSjByMapaId);
router.route("/getAllInit").get(brojSJController.getAllInDenisFormat);

router.route("/panorama").get(imageController.sendPanorama);

router.route("/getZatvoreneRez").get(stopBookingController.getStopBookingsPublic);

router.route("/v2/translations").get(generalTranslationsController.getAll);

export default router;
