import { verifyJwt } from "./jwt.mjs";

export function getUserFromEvent(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const claims = verifyJwt(token);
  return claims || null; // { sub, email, name, iat, exp }
}
