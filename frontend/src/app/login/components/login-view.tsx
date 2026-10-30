"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";

export type LoginCredentials = {
  email: string;
  password: string;
  remember: boolean;
};

export type LoginViewProps = {
  onLogin?: (credentials: LoginCredentials) => void;
};

/** Frontend demo login backed by the users shown in Master Data. */
export function LoginView() {
  const { login, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>COTS</strong>
            <small>Customer Order Tracking System</small>
          </div>
        </div>

        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to monitor and manage customer orders.</p>
        </div>

        <form onSubmit={(event) => {
          event.preventDefault();
          try {
            if (!login(email, password, remember)) {
              setError("Username atau password salah, atau akun tidak aktif.");
              return;
            }
            router.replace("/dashboard");
          } catch {
            setError("Sesi tidak dapat disimpan. Izinkan penyimpanan browser lalu coba lagi.");
          }
        }}>
          <label className="form-field">
            <span>Email or username</span>
            <input
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Username atau email"
              required
              autoComplete="username"
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <span className="password-input-wrapper">
            <input
              type={passwordVisible ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-visibility-toggle"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              <Icon name={passwordVisible ? "eye" : "eye-off"} size={18} />
            </button>
            </span>
          </label>
          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Remember me
            </label>
            <button type="button" className="text-action">
              Forgot password?
            </button>
          </div>
          {error ? <p className="project-form-error" role="alert">{error}</p> : null}
          <button type="submit" className="button button-primary login-button" disabled={!ready}>
            Sign in
          </button>
        </form>
        <p className="login-help">
          Having trouble signing in? Contact IT Support.
        </p>
      </div>
    </div>
  );
}

export default LoginView;
