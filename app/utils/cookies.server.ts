import { createCookie } from "@remix-run/node";

export const rsvpCookie = createCookie("party-rsvp", {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30, // 30 days so way past party
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production"
});
