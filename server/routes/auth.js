import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendForgotPasswordOtpEmail } from "../services/email.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "replace-this-development-secret";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // matches the 7d token expiry below
const SESSION_LIMIT = 10;

function signUser(user, sid) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email, sid },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

// Records this login as a new session (for the "Active Sessions" list) and
// drops any that are past the token's own expiry or beyond the cap, so the
// list never carries stale/revoked entries.
function recordSession(user, req) {
  const sid = crypto.randomUUID();
  const now = Date.now();
  const existing = (user.sessions || []).filter((s) => now - new Date(s.lastActiveAt || s.createdAt).getTime() < SESSION_MAX_AGE_MS);
  existing.push({
    sid,
    userAgent: req.get("user-agent") || "",
    ip: req.ip || "",
    createdAt: new Date(),
    lastActiveAt: new Date()
  });
  user.sessions = existing.slice(-SESSION_LIMIT);
  return sid;
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    company: user.company || "",
    jobTitle: user.jobTitle || "",
    role: user.role,
    status: user.status,
    preferences: user.preferences || {}
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.passwordHash || user.status === "disabled") {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials." });

    user.lastLoginAt = new Date();
    user.status = "active";
    const sid = recordSession(user, req);
    await user.save();

    res.json({ token: signUser(user, sid), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(401).json({ message: "Session user not found." });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/set-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ message: "A valid token and 8+ character password are required." });
    }

    const user = await User.findOne({
      "invite.tokenHash": sha256(token),
      "invite.expiresAt": { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: "Set-password link is invalid or expired." });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.status = "active";
    user.invite = {};
    const sid = recordSession(user, req);
    await user.save();

    res.json({ token: signUser(user, sid), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase() });

    if (user && user.status !== "disabled") {
      const otp = String(crypto.randomInt(100000, 999999));
      user.resetPassword = {
        otpHash: sha256(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      };
      await user.save();
      await sendForgotPasswordOtpEmail({ to: user.email, name: user.name, otp });
    }

    res.json({ message: "If the account exists, an OTP has been sent." });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password || password.length < 8) {
      return res.status(400).json({ message: "Email, OTP, and 8+ character password are required." });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      "resetPassword.otpHash": sha256(otp),
      "resetPassword.expiresAt": { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP." });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.status = "active";
    user.resetPassword = {};
    const sid = recordSession(user, req);
    await user.save();

    res.json({ token: signUser(user, sid), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
