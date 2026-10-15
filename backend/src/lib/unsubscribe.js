import jwt from "jsonwebtoken";

const secret = () => `${process.env.JWT_SECRET}:unsubscribe`;

export const unsubToken = (email) => jwt.sign({ e: email, p: "unsub" }, secret());

export function readUnsubToken(token) {
  try {
    const d = jwt.verify(token, secret());
    return d.p === "unsub" ? String(d.e) : null;
  } catch {
    return null;
  }
}