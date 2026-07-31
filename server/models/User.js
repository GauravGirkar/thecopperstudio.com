import mongoose from "mongoose";
import { defineModel } from "../db/defineModel.js";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    jobTitle: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["user", "developer", "superadmin"], default: "user" },
    passwordHash: { type: String, default: "" },
    status: { type: String, enum: ["invited", "active", "disabled"], default: "invited" },
    preferences: {
      language: { type: String, default: "en" },
      timezone: { type: String, default: "Asia/Kolkata" },
      notifications: {
        email: { type: Boolean, default: true },
        browser: { type: Boolean, default: false },
        weeklyReports: { type: Boolean, default: true },
        meetingReminders: { type: Boolean, default: true },
        billingAlerts: { type: Boolean, default: false }
      }
    },
    invite: {
      tokenHash: { type: String, default: "" },
      expiresAt: { type: Date },
      sentAt: { type: Date }
    },
    resetPassword: {
      otpHash: { type: String, default: "" },
      expiresAt: { type: Date },
      verifiedAt: { type: Date }
    },
    lastLoginAt: { type: Date },
    lastWeeklyReportAt: { type: Date },
    // One entry per issued login token (JWT `sid` claim) — powers the client
    // portal's "Active Sessions" list and lets a session be individually
    // revoked. Capped/pruned at write time so this never grows unbounded.
    sessions: {
      type: [{
        sid: { type: String, required: true },
        userAgent: { type: String, default: "" },
        ip: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
        lastActiveAt: { type: Date, default: Date.now }
      }],
      default: []
    }
  },
  { timestamps: true }
);

export default defineModel({
  name: "User",
  table: "users",
  schema,
  defaults: {
    phone: "",
    company: "",
    jobTitle: "",
    role: "user",
    passwordHash: "",
    status: "invited",
    preferences: {
      language: "en",
      timezone: "Asia/Kolkata",
      notifications: {
        email: true,
        browser: false,
        weeklyReports: true,
        meetingReminders: true,
        billingAlerts: false
      }
    },
    invite: { tokenHash: "", expiresAt: null, sentAt: null },
    resetPassword: { otpHash: "", expiresAt: null, verifiedAt: null },
    lastLoginAt: null,
    lastWeeklyReportAt: null,
    sessions: []
  }
});
