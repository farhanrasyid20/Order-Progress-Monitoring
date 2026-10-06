"use client";

import Link from "next/link";
import { useState } from "react";

export type LoginCredentials = {
  email: string;
  password: string;
  remember: boolean;
};

export type LoginViewProps = {
  onLogin?: (credentials: LoginCredentials) => void;
};

/** Standalone login feature. Authentication can be connected later via onLogin. */
export function LoginView() {
  const [email, setEmail] = useState("admin@company.com");
  const [password, setPassword] = useState("password");
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

        <div>
          <label className="form-field">
            <span>Email or username</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="username"
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
          <Link className="button button-primary login-button" href="/dashboard">
            Sign in
          </Link>
        </div>
        <p className="login-help">
          Having trouble signing in? Contact IT Support.
        </p>
      </div>
    </div>
  );
}

export default LoginView;
