import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { mergeCart } from "../cart/cart.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";
const ACCES_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;

//HELPERS

const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: String(user.id), role: user.role },
        JWT_SECRET,
        { expiresIn: ACCES_TOKEN_TTL }
    );
};

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

const getExpiresAt = () => {
    const date = new Date();
    date.setDate(date.getDate() + REFRESH_TOKEN_TTL_DAYS);
    return date;
};

const safeUser = (user) => ({
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at
});

//SERVICES

const register = async ({ name, email, password, sessionId }) => {

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
        const error = new Error("Email already in use");
        error.code = "EMAIL_TAKEN";
        throw error;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
        data: { name, email, password_hash },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await prisma.user_sessions.create({
        data: {
            user_id: user.id,
            refresh_token_hash: hashToken(refreshToken),
            expires_at: getExpiresAt(),
        },
    });

    if(sessionId) {
        await mergeCart(String(user.id), sessionId);
    }

    return { user: safeUser(user), accessToken, refreshToken };

};

const login = async ({ email, password }) => {

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
        const error = new Error("Invalid credentials");
        error.code= "INVALID_CREDENTIALS";
        throw error;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        const error = new Error("Invalid credentials");
        error.code = "INVALID_CREDENTIALS";
        throw error;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await prisma.user_sessions.create({
        data: {
            user_id: user.id,
            refresh_token_hash: hashToken(refreshToken),
            expires_at: getExpiresAt(),
        },
    });
    
    return { user: safeUser(user), accessToken, refreshToken };

};

const refresh = async (refreshToken) => {

    if (!refreshToken) {
        const error = new Error("No refresh token");
        error.code = "NO_REFRESH_TOKEN";
        throw error;
    }

    const tokenHash = hashToken(refreshToken);

    const session = await prisma.user_sessions.findFirst({
        where: { refresh_token_hash: tokenHash },
        include: { users:true },
    });

    if (!session || session.expires_at < new Date()) {
        if (session) {
            await prisma.user_sessions.delete({ where: { id: session.id } });
        }
        const error = new Error("Invalid or expired refresh token");
        error.code = "INVALID_REFRESH_TOKEN";
        throw error;
    }

    const accessToken = generateAccessToken(session.users);
    return { accessToken };
};

const logout = async (refreshToken) => {

    if (!refreshToken) return;

    const tokenHash = hashToken(refreshToken);
    await prisma.user_sessions.deleteMany({
        where: { refresh_token_hash: tokenHash },
    });

};

const getUserById = async (id) => {

    const user = await prisma.users.findUnique({
        where: { id: BigInt(id) },
    });
    if (!user) return null;
    return safeUser(user);

};

export { register, login, refresh, logout, getUserById };