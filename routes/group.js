import express from "express";
import multipart from "connect-multiparty";
import { GroupController } from "../controllers/index.js";
import { mdAuth } from "../middlewares/index.js";

const mdupload = multipart({ uploadDir: "./uploads/group" });
const api = express.Router();

api.post("/group", [mdAuth.asureAuth, mdupload], GroupController.create);
api.get("/group", [mdAuth.asureAuth], GroupController.getAll);
api.get("/group/:id", [mdAuth.asureAuth], GroupController.getGroup);
api.patch("/group/exit/:id", [mdAuth.asureAuth], GroupController.exitGroup);
api.patch(
  "/group/add_participants/:id",
  [mdAuth.asureAuth],
  GroupController.addParticipants
);
api.patch("/group/bannear", [mdAuth.asureAuth], GroupController.banParticipant);
api.patch(
  "/group/:id",
  [mdAuth.asureAuth, mdupload],
  GroupController.updateGroup
);

export const groupRoutes = api;
