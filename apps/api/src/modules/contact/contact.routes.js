import  { Router } from "express";
import { sendContactMessage } from "./contact.controller.js";

const contactRoutes = Router();

contactRoutes.post("/", sendContactMessage);

export { contactRoutes };