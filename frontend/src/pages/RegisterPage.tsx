import { useState, type FormEvent } from "react";
import {
  BriefcaseBusiness,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { registerUser } from "../api/auth";
import "./LoginPage.css";

interface RegisterPageProps {
  onRegistered: () => void;
  onShowLogin: () => void;
}

export default function RegisterPage({
  onRegistered,
  onShowLogin,
}: RegisterPageProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });

      onRegistered();
    } catch (requestError: unknown) {
      const response = (
        requestError as {
          response?: { data?: { detail?: string } };
        }
      ).response;

      setError(
        response?.data?.detail ||
          "Unable to create your account. Please try again.",
      );
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
          <h1>Make every application count.</h1>
          <p>
            Build a more organized job search. Keep your opportunities,
            follow-ups, and progress in one focused workspace.
          </p>

          <div className="login-feature-list">
            <div>
              <span className="login-feature-check">✓</span>
              Keep every application organized
            </div>
            <div>
              <span className="login-feature-check">✓</span>
              Track progress from one place
            </div>
            <div>
              <span className="login-feature-check">✓</span>
              Plan your next career move
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

          <span className="login-form-eyebrow">GET STARTED</span>
          <h2>Create your account</h2>
          <p className="login-form-description">
            Set up your personal job-search workspace.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="register-full-name">Full name</label>
            <div className="login-input-wrap">
              <UserRound size={18} />
              <input
                id="register-full-name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                maxLength={150}
                required
              />
            </div>

            <label htmlFor="register-username">Username</label>
            <div className="login-input-wrap">
              <UserRound size={18} />
              <input
                id="register-username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                maxLength={150}
                required
              />
            </div>

            <label htmlFor="register-email">Email address</label>
            <div className="login-input-wrap">
              <Mail size={18} />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <label htmlFor="register-password">Password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
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

            <label htmlFor="register-confirm-password">Confirm password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="register-confirm-password"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(event.target.value)
                }
                minLength={8}
                required
              />
              <button
                className="login-password-toggle"
                type="button"
                aria-label={
                  showConfirmation ? "Hide password" : "Show password"
                }
                onClick={() => setShowConfirmation((current) => !current)}
              >
                {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="login-security-note">
            Already have an account?{" "}
            <button
              type="button"
              className="auth-switch-button"
              onClick={onShowLogin}
            >
              Sign in
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
