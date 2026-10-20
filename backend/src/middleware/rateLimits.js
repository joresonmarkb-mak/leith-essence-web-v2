import rateLimit from "express-rate-limit";

const make = ({ minutes, limit, message, ...rest }) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,   // the time window
    limit,                           // max requests per IP in that window
    standardHeaders: "draft-7",      // sends RateLimit-* headers
    legacyHeaders: false,
    message: { error: message },     // same { error } shape your routes already use
    ...rest,
  });

// Everything under /api: a loose safety net
export const apiLimiter = make({
  minutes: 15, limit: 300,
  message: "Too many requests. Please slow down and try again shortly.",
});

// Login: only FAILED attempts count, so real users are never blocked
export const loginLimiter = make({
  minutes: 15, limit: 10, skipSuccessfulRequests: true,
  message: "Too many login attempts. Try again in 15 minutes.",
});

export const registerLimiter = make({
  minutes: 60, limit: 5,
  message: "Too many sign-ups from this network. Try again in an hour.",
});

// Routes that send an email (resend verification, later "forgot password")
export const emailLimiter = make({
  minutes: 60, limit: 5,
  message: "Too many email requests. Try again in an hour.",
});

export const googleLimiter = make({
  minutes: 15, limit: 20,
  message: "Too many attempts. Try again in a few minutes.",
});

export const subscribeLimiter = make({
  minutes: 60, limit: 5,
  message: "Too many sign-ups. Try again later.",
});

export const checkoutLimiter = make({
  minutes: 60, limit: 20,
  message: "Too many order attempts. Try again later.",
});

export const announceLimiter = make({
  minutes: 60, limit: 10,
  message: "Too many announcements sent. Try again later.",
});