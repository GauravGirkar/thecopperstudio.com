import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../lib/api";
import { useAuth } from "../../auth/useAuth";
import { FolderKanban, Briefcase, ArrowRight, FileText, CalendarClock, AlertCircle, CircleCheckBig } from "lucide-react";

const CS = {
  primary: "var(--cs-primary)",
  onSurface: "var(--cs-on-surface)",
  secondary: "var(--cs-secondary)",
  surfaceLow: "var(--cs-surface-container-low)",
  surfaceLowest: "var(--cs-surface-container-lowest)",
  outlineVariant: "var(--cs-outline-variant)",
};

function PageShell({ title, subtitle, children, action }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-[#E5E5E5] bg-white px-4 py-4 sm:px-6" style={{ borderColor: CS.outlineVariant }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: CS.onSurface }}>{title}</h1>
            {subtitle && <p className="mt-1 text-sm" style={{ color: CS.secondary }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-xl border bg-white p-4 shadow-sm ${className}`} style={{ borderColor: CS.outlineVariant }}>{children}</div>;
}

function StatCard({ label, value, icon: Icon, tone = "default" }) {
  const tones = {
    default: { bg: "bg-[#fff8f6]", text: "text-[#8D3118]" },
    green: { bg: "bg-[#ecfdf5]", text: "text-[#047857]" },
    amber: { bg: "bg-[#fff7ed]", text: "text-[#c2410c]" },
  };

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${tones[tone].bg}`}>
        <Icon size={18} className={tones[tone].text} />
      </div>
      <div className="text-2xl font-semibold text-[#111827]">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[#6b7280]">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    not_started: { label: "Not Started", color: "bg-slate-100 text-slate-700" },
    in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700" },
    completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  };
  const info = map[status] || { label: "Not Started", color: "bg-slate-100 text-slate-700" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${info.color}`}>{info.label}</span>;
}

export function DeveloperDashboardPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await apiGet("/api/developer/projects", token);
        if (active) setProjects(Array.isArray(data) ? data : []);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [token]);

  const stats = useMemo(() => {
    const activeCount = projects.filter((project) => project.status === "in_progress" || project.status === "not_started").length;
    const completeCount = projects.filter((project) => project.status === "completed").length;
    return { total: projects.length, active: activeCount, complete: completeCount };
  }, [projects]);

  return (
    <PageShell title="Developer Dashboard" subtitle="Your assigned work across active projects.">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Assigned projects" value={stats.total} icon={FolderKanban} tone="default" />
        <StatCard label="Active" value={stats.active} icon={CalendarClock} tone="amber" />
        <StatCard label="Completed" value={stats.complete} icon={CircleCheckBig} tone="green" />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#111827]">
            <Briefcase size={18} className="text-[#8D3118]" />
            <h2 className="text-base font-semibold">Current assignments</h2>
          </div>
          <Link to="/developer/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-[#8D3118] hover:underline">View all <ArrowRight size={15} /></Link>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#fafafa] p-10 text-center text-sm text-[#6b7280]">Loading your projects…</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#fafafa] p-10 text-center text-sm text-[#6b7280]">You are not assigned to any projects yet.</div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 4).map((project) => (
              <div key={project._id || project.id} className="flex flex-col gap-2 rounded-xl border border-[#E5E5E5] bg-[#fafafa] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#111827]">{project.name}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="mt-1 text-sm text-[#6b7280]">{project.companyName || "No company assigned"}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                  <span>{project.progress || 0}% complete</span>
                  <span>{project.packageName || "No package"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}

export function DeveloperProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await apiGet("/api/developer/projects", token);
        if (active) setProjects(Array.isArray(data) ? data : []);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [token]);

  return (
    <PageShell title="My Projects" subtitle="All projects assigned to your developer account.">
      <Card>
        {loading ? (
          <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#fafafa] p-10 text-center text-sm text-[#6b7280]">Loading assigned projects…</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#fafafa] p-10 text-center text-sm text-[#6b7280]">No project assignments found.</div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project._id || project.id} className="rounded-xl border border-[#E5E5E5] bg-[#fafafa] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FolderKanban size={16} className="text-[#8D3118]" />
                      <h3 className="text-base font-semibold text-[#111827]">{project.name}</h3>
                    </div>
                    <p className="mt-2 text-sm text-[#6b7280]">{project.companyName || "No company assigned"}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-[#E5E5E5] bg-white p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Package</div>
                    <div className="mt-2 text-sm font-medium text-[#111827]">{project.packageName || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-[#E5E5E5] bg-white p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Progress</div>
                    <div className="mt-2 text-sm font-medium text-[#111827]">{project.progress || 0}%</div>
                  </div>
                  <div className="rounded-lg border border-[#E5E5E5] bg-white p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Current phase</div>
                    <div className="mt-2 text-sm font-medium text-[#111827]">{project.currentPhase || "—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}

export function DeveloperSettingsPage() {
  const { user } = useAuth();
  return (
    <PageShell title="Profile" subtitle="Your developer profile details.">
      <Card>
        <div className="flex items-center gap-3 rounded-xl bg-[#fff8f6] p-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#F5D5C6] text-[#8D3118]">
            <Briefcase size={20} />
          </div>
          <div>
            <div className="text-lg font-semibold text-[#111827]">{user?.name || "Developer"}</div>
            <div className="text-sm text-[#6b7280]">{user?.email || "No email"}</div>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
