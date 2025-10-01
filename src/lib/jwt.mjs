import jwt from "jsonwebtoken";

const { JWT_SECRET = "CHANGE_ME_DEV_SECRET" } = process.env;

export function signJwt(claims, expiresIn = "7d") {
  return jwt.sign(claims, JWT_SECRET, { algorithm: "HS256", expiresIn });
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}
