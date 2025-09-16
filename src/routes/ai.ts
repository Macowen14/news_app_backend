import { Router } from "express";
import { aiSearchController } from "../controllers/aiController.js";

export const aiRouter = Router();

aiRouter.post("/search", aiSearchController);


