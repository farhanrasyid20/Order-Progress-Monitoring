"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type LoginCredentials = {
  email: string;
  password: string;
  remember: boolean;
};

export type LoginViewProps = {
  onLogin?: (credentials: LoginCredentials) => void;
};

/** Standalone login feature. Authentication can be connected later via onLogin. */
export function LoginView({ onLogin }: LoginViewProps) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@company.com");
  const [password, setPassword] = useState("password");
  const [remember, setRemember] = useState(true);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const credentials = { email, password, remember };

    if (onLogin) {
      onLogin(credentials);
      return;
    }

    router.push("/");
  }

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

        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email or username</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="username"
              required
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
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
          <Button type="submit" className="login-button">
            Sign in
          </Button>
        </form>
        <p className="login-help">
          Having trouble signing in? Contact IT Support.
        </p>
      </div>

      <div className="login-aside">
        <div>
          <span className="eyebrow">INTERNAL OPERATIONS</span>
          <h2>Every order, clearly tracked from request to production.</h2>
          <p>
            A single source of truth for progress, ownership, deadlines,
            documents, and approvals.
          </p>
          <div className="login-proof">
            <div>
              <strong>248</strong>
              <span>Active orders</span>
            </div>
            <div>
              <strong>94%</strong>
              <span>On-time completion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginView;
