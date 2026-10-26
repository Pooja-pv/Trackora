import { useCallback, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./Dashboard";
import "./App.css";
import {
  getCurrentUser,
  logoutUser,
  type AuthUser,
} from "./api/auth";

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

  async function handleLogout() {
    setLogoutError("");

    try {
      await logoutUser();
      setUser(null);
    } catch {
      setLogoutError("Unable to log out. Please try again.");
    }
  }

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
    <div className="app-shell">
      <header className="topbar">
        <div className="breadcrumb">
          <span>Workspace</span>
          <span>/</span>
          <strong>Dashboard</strong>
        </div>

        <div className="topbar-actions">
          <span className="signed-in-label">
            Signed in as <strong>{user.username}</strong>
          </span>

          <button
            type="button"
            className="secondary-button"
            onClick={handleLogout}
          >
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
        <Dashboard />
      </main>
    </div>
  );
}