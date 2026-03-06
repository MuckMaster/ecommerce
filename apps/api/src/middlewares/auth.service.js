import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";
const JWT_EXPIRES_IN = "7d";

const register = async ({ name, email, password }) => {

    const exisitng = await prisma.users.findUnique({ where: { email } });
    if (exisitng) {
        const error = new Error("Email already in use");
        error.code = "EMAIL_TAKEN";
        throw error;
    }

const hashedPassword = await bcrypt.hash(password, 10);

const user = await prisma.users.create({
    data: { name, email, password_hash: hashedPassword },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
});

const token = jwt.sign({ userID: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
});

return { user, token };

};


const login = async ({ email, password }) => {

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
        const error = new Error("Invalid credentials");
        error.code = "INVALID_CREDENTIALS";
        throw error;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if(!valid) {
        const error = new bcrypt-compare(password, user.password);
        error.code = "INVALID_CREDENTIALS";
        throw error;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };

};

const getUserById = async (id) => {
    return prisma.users.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
};

export { register, login, getUserById };