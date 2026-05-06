import * as contactService from "./contact.service.js";

const sendContactMessage = async (req, res) => {

    try{
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "Missing required fields: name, email, message" })
        }

        const result = await contactService.sendContactMessage({ name, email, phone, message });
        res.status(201).json({ ok: true, data: result });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

export { sendContactMessage };