import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
  throw new Error("JWT_SECRET no está configurado correctamente");
}

export const JWT_SECRET = secret;

export const JWT_OPTIONS = {
  algorithm: "HS256",
  expiresIn: "1h",
  issuer: "contratos-api",
  audience: "contratos-client"
} as const;

export { jwt };