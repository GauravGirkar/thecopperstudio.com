import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { LayoutDashboard, FolderKanban, LogOut, Menu, X, ChevronDown, Search, Briefcase, ChevronsLeft, ChevronsRight } from "lucide-react";

const SEARCHABLE_PAGES = [
  { label: "Dashboard", to: "/developer", keywords: "home overview" },
  { label: "My Projects", to: "/developer/projects", keywords: "timeline assignments projects" },
  { label: "Profile", to: "/developer/profile", keywords: "profile account settings" },
];

function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCHABLE_PAGES.filter((page) => `${page.label} ${page.keywords}`.toLowerCase().includes(q)).slice(0, 5).map((page) => ({ label: page.label, to: page.to }));
  }, [query]);

  function openResult(r) {
    if (!r) return;
    navigate(r.to);
    setQuery("");
    setFocused(false);
  }

  return (
    <div className="relative w-64 hidden md:block">
      <div className="flex h-8 items-center gap-2 rounded-full border border-[#E1E4EA] px-3 transition-colors focus-within:border-[#8D3118] focus-within:bg-[#fff8f6]">
        <Search size={14} className="shrink-0 text-[#525866]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") openResult(results[0]);
            if (e.key === "Escape") {
              setQuery("");
              setFocused(false);
            }
          }}
          placeholder="Search pages…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#525866]"
        />
      </div>
      {focused && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-lg">
          {results.length ? (
            <div className="py-1">
              {results.map((r) => (
                <button
                  key={r.to}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => openResult(r)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[#f9fafb]"
                >
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
  const initials = (userName || "D")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function go(to) {
    navigate(to);
    setMobileOpen(false);
  }

  function handleLogout() {
    auth.logout();
    navigate("/login", { replace: true });
  }

  const sidebarW = collapsed ? 66 : 264;
  const baseW = pinned ? 264 : 66;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFFFF]">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#FAFAFA] border-r border-[#ECECEC] transition-all duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ width: mobileOpen ? 264 : sidebarW }}
      >
        <div className={`flex items-center justify-center border-b border-[#ECECEC] ${collapsed && !mobileOpen ? "px-1 py-3" : "px-4 py-5"}`}>
          <img
            src="/copper-studio-wordmark.png"
            alt="Copper Studio"
            className={`object-contain ${collapsed && !mobileOpen ? "h-8 w-auto" : "h-9 w-auto max-w-full"}`}
          />
          {mobileOpen && (
            <button className="ml-auto text-[#9ca3af] hover:text-[#111827] lg:hidden" onClick={() => setMobileOpen(false)}>
              <X size={16} />
            </button>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-3 ${collapsed && !mobileOpen ? "flex flex-col items-center gap-2.5" : "space-y-0.5 px-3"}`}>
          {(!collapsed || mobileOpen) && <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">Navigation</p>}
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed && !mobileOpen} active={isActive(item, location.pathname)} onNavigate={go} />
          ))}
        </nav>

        <div className={`border-t border-[#ECECEC] ${collapsed && !mobileOpen ? "flex flex-col items-center gap-2 py-3" : "space-y-2 p-3"}`}>
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8D3118] text-xs font-bold text-white">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#111827]">{userName}</p>
                <p className="truncate text-[10px] text-[#9ca3af]">{auth.user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-[#9ca3af] transition-colors hover:text-red-500" title="Log out">
                <LogOut size={14} />
              </button>
            </div>
          )}
          <button
            onClick={() => (mobileOpen ? setMobileOpen(false) : setPinned((v) => !v))}
            title={mobileOpen ? "Close sidebar" : pinned ? "Unpin sidebar" : "Pin sidebar open"}
            className={`flex items-center gap-2 rounded-lg border border-[#E5E5E5] bg-white text-sm font-semibold text-[#525252] transition-colors hover:bg-[#f9fafb] ${collapsed && !mobileOpen ? "h-9 w-9 justify-center" : "w-full px-3 py-2"}`}
          >
            {collapsed && !mobileOpen ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
            {(!collapsed || mobileOpen) && "Collapse"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-[var(--developer-rail-w)]" style={{ "--developer-rail-w": `${baseW}px` }}>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[#E1E4EA] bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-lg p-1.5 text-[#6b7280] hover:text-[#111827] lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#8D3118]">Developer Portal</p>
              <h1 className="truncate text-lg font-semibold text-[#111827]">Hi, {userName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <HeaderSearch />
            <div className="rounded-full border border-[#E5E5E5] bg-[#fff8f6] px-3 py-1.5 text-xs font-medium text-[#8D3118]">{auth.user?.email || "Developer"}</div>
            <div className="relative">
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E5E5] bg-white p-1 transition-all hover:ring-2 hover:ring-[#8D3118]/20"
                title="Log out"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8D3118] text-xs font-medium text-white">{initials}</span>
              </button>
            </div>
          </div>
        </header>

        {mobileOpen && (
          <div className="border-b border-[#E5E5E5] bg-white p-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.to}
                  onClick={() => {
                    navigate(item.to);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isActive(item, location.pathname) ? "bg-[#fff8f6] text-[#8D3118]" : "text-[#374151]"}`}
                >
                  <item.icon size={16} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
