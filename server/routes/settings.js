import bcrypt from "bcryptjs";
import express from "express";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendTestEmail } from "../services/email.js";

const router = express.Router();

router.use(requireAuth, requireRole("superadmin"));

// Workspace settings are a single shared document — fetch it, creating it on
// first use so every section always has a row to update against.
async function getSingleton() {
  const existing = await Settings.findOne({});
  if (existing) return existing;
  return Settings.create({});
}

router.get("/", async (req, res, next) => {
  try {
    const [user, settings] = await Promise.all([
      User.findById(req.auth.sub).select("-passwordHash -invite -resetPassword"),
      getSingleton()
    ]);
    if (!user) return res.status(404).json({ message: "Admin user not found." });

    res.json({
      profile: {
        fullName: user.name,
        email: user.email,
        phone: user.phone || "",
        title: user.jobTitle || "",
        timezone: user.preferences?.timezone || "Asia/Kolkata",
        publicUrl: settings.workspace?.publicUrl || ""
      },
      company: settings.company,
      billing: settings.billing,
      email: settings.email,
      notifications: settings.notifications,
      security: settings.security,
      dataFields: settings.dataFields || {}
    });
  } catch (error) {
    next(error);
  }
});

// Configurable dropdown option lists. The frontend owns the canonical defaults
// and merges them over whatever is stored, so we just persist the raw map here.
router.get("/data-fields", async (_req, res, next) => {
  try {
    const settings = await getSingleton();
    res.json({ dataFields: settings.dataFields || {} });
  } catch (error) {
    next(error);
  }
});

router.put("/data-fields", async (req, res, next) => {
  try {
    const dataFields = req.body?.dataFields && typeof req.body.dataFields === "object" ? req.body.dataFields : {};
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { dataFields } },
      { upsert: true, new: true }
    );
    res.json({ dataFields: settings.dataFields || {} });
  } catch (error) {
    next(error);
  }
});

// Updates the signed-in superadmin's own personal details.
// Returns both the flattened `profile` shape (for the Settings form) and the
// raw `user` fields so the frontend can immediately call `auth.updateUser()`.
router.put("/profile", async (req, res, next) => {
  try {
    const { fullName, phone, title } = req.body;
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(404).json({ message: "Admin user not found." });

    if (fullName !== undefined) user.name = String(fullName).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (title !== undefined) user.jobTitle = String(title).trim();
    await user.save();

    const profile = {
      fullName: user.name,
      email: user.email,
      phone: user.phone || "",
      title: user.jobTitle || "",
    };
    // Return the canonical `user` shape so the client can call auth.updateUser()
    res.json({
      profile,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        jobTitle: user.jobTitle || "",
        role: user.role,
        status: user.status,
        preferences: user.preferences || {},
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put("/workspace", async (req, res, next) => {
  try {
    const { publicUrl = "" } = req.body;
    await Settings.findOneAndUpdate({}, { $set: { workspace: { publicUrl } } }, { upsert: true, new: true });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.put("/company", async (req, res, next) => {
  try {
    const { studioName = "", legalName = "", gstin = "", billingEmail = "", website = "", billingAddress = "" } = req.body;
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { company: { studioName, legalName, gstin, billingEmail, website, billingAddress } } },
      { upsert: true, new: true }
    );
    res.json({ company: settings.company });
  } catch (error) {
    next(error);
  }
});

router.put("/billing", async (req, res, next) => {
  try {
    const {
      gateway = "Razorpay", apiBase = "", invoicePrefix = "INV",
      defaultRole = "user", autoInviteAfterPayment = true, allowCouponAtCheckout = true
    } = req.body;
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { billing: { gateway, apiBase, invoicePrefix, defaultRole, autoInviteAfterPayment, allowCouponAtCheckout } } },
      { upsert: true, new: true }
    );
    res.json({ billing: settings.billing });
  } catch (error) {
    next(error);
  }
});

router.put("/email", async (req, res, next) => {
  try {
    const {
      senderName = "", senderEmail = "",
      onboardingPath = "/client-secure-onboarding/access-setup"
    } = req.body;
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { email: { senderName, senderEmail, onboardingPath } } },
      { upsert: true, new: true }
    );
    res.json({ email: settings.email });
  } catch (error) {
    next(error);
  }
});

router.put("/notifications", async (req, res, next) => {
  try {
    const {
      paymentSuccess = true, failedPayments = true,
      portalInviteSent = true, overdueInvoices = true
    } = req.body;
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { notifications: { paymentSuccess, failedPayments, portalInviteSent, overdueInvoices } } },
      { upsert: true, new: true }
    );
    res.json({ notifications: settings.notifications });
  } catch (error) {
    next(error);
  }
});

router.put("/security", async (req, res, next) => {
  try {
    const { inviteExpiry = "48 hours", otpExpiry = "10 minutes" } = req.body;
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { security: { inviteExpiry, otpExpiry } } },
      { upsert: true, new: true }
    );
    res.json({ security: settings.security });
  } catch (error) {
    next(error);
  }
});

// Re-confirms the admin's password before unlocking the Security &
// Integrations tab — doesn't change anything, just gates access to the
// credential-bearing fields for that session.
router.post("/verify-password", async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Enter your password to continue." });

    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(404).json({ message: "Admin user not found." });

    const ok = await bcrypt.compare(password, user.passwordHash || "");
    if (!ok) return res.status(401).json({ message: "Incorrect password." });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// Send a test email using the current template body/subject with filled-in vars.
// Sends to the address provided in the request (falls back to admin's own email).
router.post("/test-email", async (req, res, next) => {
  try {
    const { to: toOverride = "", subject = "", body = "", vars = {} } = req.body;
    const user = await User.findById(req.auth.sub).select("email name");
    const to = toOverride.trim() || user?.email;
    if (!to) return res.status(400).json({ message: "Recipient email is required." });

    // Replace {{variable}} tokens with provided test values
    function interpolate(text) {
      return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
    }

    // For JSON body, interpolate each block's text fields
    function interpolateBody(raw) {
      const s = raw.trim();
      if (s.startsWith("[") && s.endsWith("]")) {
        try {
          const blocks = JSON.parse(s);
          return JSON.stringify(blocks.map((b) => ({
            ...b,
            ...(b.text ? { text: interpolate(b.text) } : {}),
            ...(b.title ? { title: interpolate(b.title) } : {}),
            ...(b.href ? { href: interpolate(b.href) } : {}),
          })));
        } catch { /* fall through */ }
      }
      return interpolate(raw);
    }

    await sendTestEmail({
      to,
      subject: interpolate(subject),
      body: interpolateBody(body),
    });

    res.json({ ok: true, sentTo: to });
  } catch (error) {
    next(error);
  }
});

export default router;
