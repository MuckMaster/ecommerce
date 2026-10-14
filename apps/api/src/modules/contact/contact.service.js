import { prisma } from "../../lib/prisma.js";
import nodemailer from "nodemailer";
import { STORE_NAME } from "../../config/brand.js";

const transporter = nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port: Number (process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendContactMessage = async ({ name, email, phone, message }) => {
    const contact = await prisma.contact_messages.create({
        data: { name, email, phone, message },
    });

    await transporter.sendMail({
        from: `"${STORE_NAME} Web" <${process.env.SMTP_USER}>`,
        to: process.env.CONTACT_EMAIL,
        subject: `Nuevo mensaje de contacto de ${name}`,
        html: `
            <h2>Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Teléfono:</strong> ${phone || "No proporcionado"}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${message}</p>
        `
    });

    return {
        id: String(contact.id),
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        message: contact.message,
        created_at: contact.created_at,
    };
};

export { sendContactMessage };