import  { Router } from "express";
import { sendContactMessage } from "./contact.controller.js";
import { contactLimiter } from "../../middlewares/rateLimit.middleware.js";

const contactRoutes = Router();

contactRoutes.post("/", contactLimiter, sendContactMessage);

export { contactRoutes };