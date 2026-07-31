import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole,
  Mail, ShieldCheck, UserRound
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { isEmail } from "../../lib/validators";

function AuthShell({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-[#f0ede4] text-[#211a17] grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="studio-gradient hidden lg:flex flex-col justify-between border-r border-[#211a17] px-10 py-9 text-white">
        <div>
          <img src="/copper-studio-wordmark.png" alt="Copper Studio" className="h-16 w-auto object-contain" />
        </div>

        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
            <ShieldCheck size={14} />
            Authenticated access only
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight">
            Premium studio access after package purchase.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-white/68">
            Clients receive a secure email link after payment, set their own password, and return to the shared login page. Admins manage the full creative pipeline from one protected workspace.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["Payment verified", "Invite emailed", "Portal unlocked"].map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <CheckCircle2 size={16} className="text-[#E7A98C]" />
              <p className="mt-3 text-xs font-semibold text-white/86">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center bg-white px-5 py-8">
        <div className="w-full max-w-[440px] rounded-xl border border-[#d8c2b9] bg-[#fff8f6] p-6 shadow-[0_24px_80px_rgba(54,47,44,0.12)] sm:p-8">
          <div className="mb-7">
            <div className="mb-4 h-11 w-11 rounded-xl bg-[#F5D5C6] text-[#8D3118] grid place-items-center">
              <LockKeyhole size={20} />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#211a17]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6c6355]">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function Field({ icon: Icon, type = "text", label, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  const inputType = type === "password" && visible ? "text" : type;

  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#6c6355]">{label}</span>
      <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#d8c2b9] bg-[#fff1ec] px-3 py-2.5 focus-within:border-[#8D3118] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#F5D5C6]/70">
        <Icon size={16} className="text-[#85736c]" />
        <input
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-sm text-[#211a17] outline-none placeholder:text-[#b49f96]"
        />
        {type === "password" && (
          <button type="button" onClick={() => setVisible((next) => !next)} className="text-[#85736c] hover:text-[#8D3118]">
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </span>
    </label>
  );
}

function SubmitButton({ children, loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8D3118] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#8D3118]/20 transition-colors hover:bg-[#9A4113] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
      <ArrowRight size={16} />
    </button>
  );
}

function Message({ type, children }) {
  if (!children) return null;
  const styles = type === "error" ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700";
  return <div className={`rounded-2xl border px-3 py-2 text-xs font-medium ${styles}`}>{children}</div>;
}

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (auth.isAuthenticated) {
    const fallback = auth.user?.role === "superadmin" ? "/admin" : auth.user?.role === "developer" ? "/developer" : "/client";
    return <Navigate to={location.state?.from?.pathname || fallback} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!isEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      const session = await auth.login({ email, password });
      const fallback = session.user.role === "superadmin" ? "/admin" : session.user.role === "developer" ? "/developer" : "/client";
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Log in to CRM" subtitle="Sign in with your email and password to continue.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field icon={Mail} label="Email address" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
        <Field icon={KeyRound} type="password" label="Password" value={password} onChange={setPassword} placeholder="Enter password" autoComplete="current-password" />
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Secure JWT session</span>
          <Link to="/forgot-password" className="font-semibold text-[#2563EB] hover:text-blue-700">Forgot password?</Link>
        </div>
        <Message type="error">{error}</Message>
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function sendOtp(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!isEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const data = await auth.forgotPassword({ email });
      setOtpSent(true);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const session = await auth.resetPassword({ email, otp, password });
      const fallback = session.user.role === "superadmin" ? "/admin" : session.user.role === "developer" ? "/developer" : "/client";
      navigate(fallback, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset password" subtitle="Request an OTP on email, then create a new password.">
      <form onSubmit={otpSent ? resetPassword : sendOtp} className="space-y-4">
        <Field icon={Mail} label="Email address" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
        {otpSent && (
          <>
            <Field icon={UserRound} label="OTP" value={otp} onChange={setOtp} placeholder="6 digit code" autoComplete="one-time-code" />
            <Field icon={KeyRound} type="password" label="New password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" autoComplete="new-password" />
          </>
        )}
        <Message type="success">{message}</Message>
        <Message type="error">{error}</Message>
        <SubmitButton loading={loading}>{otpSent ? "Reset password" : "Send OTP"}</SubmitButton>
        <Link to="/login" className="block text-center text-xs font-semibold text-gray-500 hover:text-[#2563EB]">Back to login</Link>
      </form>
    </AuthShell>
  );
}

export function SetPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("Access setup token is missing from the link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await auth.setPassword({ token, password });
      auth.logout();
      setMessage("Password created successfully. Redirecting to login...");
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Client access setup" subtitle="Use the secure private link from your payment confirmation email.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!token && <Message type="error">Access setup token is missing from the link.</Message>}
        <Field icon={KeyRound} type="password" label="New password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" autoComplete="new-password" />
        <Field icon={KeyRound} type="password" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat password" autoComplete="new-password" />
        <Message type="success">{message}</Message>
        <Message type="error">{error}</Message>
        <SubmitButton loading={loading}>Activate portal</SubmitButton>
        <Link to="/login" className="block text-center text-xs font-semibold text-gray-500 hover:text-[#2563EB]">Back to login</Link>
      </form>
    </AuthShell>
  );
}
