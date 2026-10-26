
import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Clock3,
  FileUp,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./Dashboard";
import Overview from "./pages/Overview";
import AnalyticsPage from "./pages/AnalyticsPage";
import FollowUpsPage from "./pages/FollowUpsPage";
import ImportJobsPage from "./pages/ImportJobsPage";
import "./App.css";
import {
  getCurrentUser,
  logoutUser,
  type AuthUser,
} from "./api/auth";

const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/applications", label: "My Applications", icon: BriefcaseBusiness, end: false },
  { to: "/analytics", label: "Analytics", icon: ChartNoAxesCombined, end: false },
  { to: "/follow-ups", label: "Follow-ups", icon: Clock3, end: false },
  { to: "/import", label: "Import Jobs", icon: FileUp, end: false },
];

function Workspace({
  user,
  onLogout,
  logoutError,
}: {
  user: AuthUser;
  onLogout: () => void;
  logoutError: string;
}) {
  const location = useLocation();
  const currentPage = navigation.find((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to),
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="breadcrumb">
          <span>Workspace</span>
          <span>/</span>
          <strong>{currentPage?.label ?? "Overview"}</strong>
        </div>

        <div className="topbar-actions">
          <span className="signed-in-label">
            Signed in as <strong>{user.username}</strong>
          </span>

          <button type="button" className="secondary-button" onClick={onLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      {logoutError && (
        <p className="logout-error" role="alert">
          {logoutError}
        </p>
      )}

      <main className="dashboard-content">
        <div className="dashboard-page">
          <aside className="dashboard-sidebar">
            <div className="dashboard-brand">
              <span className="dashboard-brand-icon">
                <BriefcaseBusiness size={21} />
              </span>
              <span>Trackora</span>
            </div>

            <p className="sidebar-section-label">WORKSPACE</p>

            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{label}</span>
              </NavLink>
            ))}

            <div className="sidebar-bottom">
              <div className="sidebar-tip">
                <ChartNoAxesCombined size={20} />
                <strong>Stay organized. Move forward.</strong>
                <p>
                  Every application is a step closer to your next opportunity.
                </p>
              </div>
            </div>
          </aside>

          <div className="dashboard-main">
            <header className="dashboard-topbar">
              <div>
                <p className="dashboard-breadcrumb">YOUR CAREER WORKSPACE</p>
                <h1>{currentPage?.label ?? "Overview"}</h1>
              </div>
            </header>

            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/applications" element={<Dashboard />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/follow-ups" element={<FollowUpsPage />} />
              <Route path="/import" element={<ImportJobsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <footer className="dashboard-footer">
              <span>Trackora</span>
              <span>Stay organized. Move forward.</span>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [logoutError, setLogoutError] = useState("");

  const checkSession = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const handleLogout = async () => {
    setLogoutError("");

    try {
      await logoutUser();
      setUser(null);
    } catch {
      setLogoutError("Unable to log out. Please try again.");
    }
  };

  if (checkingSession) {
    return (
      <main className="loading-screen">
        <div className="loading-indicator" />
      </main>
    );
  }

  if (!user) {
    return <LoginPage onLogin={checkSession} />;
  }

  return (
    <BrowserRouter>
      <Workspace
        user={user}
        onLogout={() => void handleLogout()}
        logoutError={logoutError}
      />
    </BrowserRouter>
  );
}
