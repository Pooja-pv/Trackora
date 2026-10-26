import { useState, type FormEvent } from "react";
import { BriefcaseBusiness, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { loginUser } from "../api/auth";
import "./LoginPage.css";

interface LoginPageProps {
  onLogin: () => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser({ username, password });
      await onLogin();
    } catch {
      setError("Login failed. Check your username and password, then try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <a className="login-brand" href="/">
          <span className="login-brand-icon">
            <BriefcaseBusiness size={22} />
          </span>
          <span>Trackora</span>
        </a>

        <div className="login-showcase-content">
          <span className="login-eyebrow">YOUR CAREER, IN FOCUS</span>
          <h1>Every opportunity deserves a plan.</h1>
          <p>
            Bring your job search into focus. Organize applications, track
            progress, and approach your next career move with confidence.
          </p>

          <div className="login-feature-list">
            <div>
              <span className="login-feature-check">✓</span>
              Keep every application organized
            </div>
            <div>
              <span className="login-feature-check">✓</span>
              Know your next step at a glance
            </div>
            <div>
              <span className="login-feature-check">✓</span>
              Stay focused on your goals
            </div>
          </div>
        </div>

        <p className="login-showcase-footer">
          A clearer path from application to opportunity.
        </p>
      </section>

      <section className="login-form-section">
        <div className="login-form-wrapper">
          <div className="login-mobile-brand">
            <span className="login-brand-icon">
              <BriefcaseBusiness size={22} />
            </span>
            <span>Trackora</span>
          </div>

          <span className="login-form-eyebrow">WELCOME BACK</span>
          <h2>Sign in to Trackora</h2>
          <p className="login-form-description">
            Enter your account details to continue.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="username">Username</label>
            <div className="login-input-wrap">
              <UserRound size={18} />
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>

            <label htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="login-password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="login-security-note">
            Your account is protected by secure session authentication.
          </p>
        </div>
      </section>
    </main>
  );
}
