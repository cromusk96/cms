import express from "express";
const router = express.Router();
import usersController from "../../controllers/usersController.js";

router
  .route("/users")
  .get(usersController.getAllUsers)
  .post(usersController.saveUser)
  .put(usersController.saveUser);

router.route("/user/:uid").delete(usersController.deleteUser);

router.route("/isAdmin").get(usersController.isAdmin);

router.route("/priviledges").get(usersController.getUserKamp);

export default router;
