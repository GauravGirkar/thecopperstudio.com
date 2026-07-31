import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { LayoutDashboard, FolderKanban, LogOut, Menu, X, ChevronDown, Search, Briefcase, FileText } from "lucide-react";
import { useToast } from "../components/useToast";
import { apiGet } from "../lib/api";
import { storeGet, storeSet } from "../lib/store";

const SEARCHABLE_PAGES = [
  { label: "Dashboard", to: "/developer", keywords: "home overview" },
  { label: "My Projects", to: "/developer/projects", keywords: "timeline assignments projects" },
  { label: "Profile", to: "/developer/profile", keywords: "profile account settings" },
];

function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCHABLE_PAGES.filter((page) => `${page.label} ${page.keywords}`.toLowerCase().includes(q)).slice(0, 5).map((page) => ({ label: page.label, to: page.to }));
  }, [query]);

  return (
    <div className="relative w-64 hidden md:block">
      <div className="flex h-8 items-center gap-2 rounded-full border border-[#E1E4EA] bg-white px-3">
        <Search size={14} className="text-[#525866]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search pages…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#525866]"
        />
      </div>
      {focused && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-lg">
          {results.length ? (
            <div className="py-1">
              {results.map((r) => (
                <button key={r.to} onMouseDown={(e) => e.preventDefault()} onClick={() => { setQuery(""); setFocused(false); navigate(r.to); }} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[#f9fafb]">
                  <span className="text-sm font-medium text-[#111827]">{r.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-3 text-xs text-[#6b7280]">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/developer", end: true },
  { icon: FolderKanban, label: "My Projects", to: "/developer/projects" },
  { icon: Briefcase, label: "Profile", to: "/developer/profile" },
];

function isActive(item, pathname) {
  return item.end ? pathname === item.to : pathname.startsWith(item.to);
}

function NavItem({ item, collapsed, active, onNavigate }) {
  if (collapsed) {
    return (
      <button
        onClick={() => onNavigate(item.to)}
        title={item.label}
        className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${active ? "bg-white border-[#E5E5E5] text-[#8D3118] shadow-sm" : "border-transparent text-[#374151] hover:bg-white/70"}`}
      >
        <item.icon size={20} strokeWidth={1.8} className="shrink-0" />
      </button>
    );
  }

  return (
    <button
      onClick={() => onNavigate(item.to)}
      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${active ? "bg-white border border-[#E5E5E5] text-[#8D3118] shadow-sm" : "text-[#374151] hover:bg-white/70"}`}
    >
      <item.icon size={16} strokeWidth={1.8} className="shrink-0" />
      <span className="truncate text-sm font-medium">{item.label}</span>
    </button>
  );
}

export default function DeveloperLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = !pinned && !hovering;

  useEffect(() => {
    if (auth.user?.role !== "developer") {
      auth.logout();
      navigate("/login", { replace: true });
    }
  }, [auth, navigate]);

  const userName = auth.user?.name || "Developer";

  return (
    <div className="flex min-h-screen bg-[#f5f5f3] text-[#111827]">
      <aside
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`hidden border-r border-[#E5E5E5] bg-[#f8f8f7] transition-all duration-200 lg:flex ${collapsed ? "w-[84px]" : "w-[240px]"}`}
      >
        <div className="flex w-full flex-col gap-4 p-3">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <button onClick={() => navigate("/developer")} className="flex min-w-0 items-center gap-2 overflow-hidden">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#fff5f1] text-[#8D3118]">
                <FolderKanban size={18} />
              </div>
              {!collapsed && <span className="truncate text-sm font-semibold text-[#111827]">Developer Hub</span>}
            </button>
            <button onClick={() => setPinned((v) => !v)} className="hidden rounded-lg p-1 text-[#6b7280] hover:bg-white md:inline-flex" aria-label="Toggle sidebar">
              <ChevronDown size={16} className={`transition-transform ${pinned ? "rotate-180" : ""}`} />
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} active={isActive(item, location.pathname)} onNavigate={(to) => { navigate(to); setMobileOpen(false); }} />
            ))}
          </nav>

          <div className="mt-auto pt-2">
            <button
              onClick={() => auth.logout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[#374151] hover:bg-white/70"
            >
              <LogOut size={16} />
              {!collapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[#E5E5E5] bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button className="lg:hidden p-2 rounded-lg border border-[#E5E5E5] bg-white" onClick={() => setMobileOpen((v) => !v)}>
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#8D3118]">Developer Portal</p>
                <h1 className="truncate text-lg font-semibold text-[#111827]">Hi, {userName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HeaderSearch />
              <div className="rounded-full border border-[#E5E5E5] bg-[#fff8f6] px-3 py-1.5 text-xs font-medium text-[#8D3118]">{auth.user?.email || "Developer"}</div>
            </div>
          </div>
        </header>

        {mobileOpen && (
          <div className="border-b border-[#E5E5E5] bg-white p-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button key={item.to} onClick={() => { navigate(item.to); setMobileOpen(false); }} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isActive(item, location.pathname) ? "bg-[#fff8f6] text-[#8D3118]" : "text-[#374151]"}`}>
                  <item.icon size={16} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
