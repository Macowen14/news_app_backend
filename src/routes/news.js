import { Router } from "express";
import { getCategoryNewsController } from "../controllers/newsController.js";

export const newsRouter = Router();

newsRouter.get("/:category", getCategoryNewsController);


