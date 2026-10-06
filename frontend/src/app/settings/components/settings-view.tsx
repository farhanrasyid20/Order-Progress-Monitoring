"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

/** Settings is configuration, so it saves inline rather than creating queue data. */
export function SettingsView() {
  const [workspaceName, setWorkspaceName] = useState("COTS Workspace");
  const [defaultPic, setDefaultPic] = useState("Project Manager");
  const [deadlineReminder, setDeadlineReminder] = useState("3");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaved(true);
  };

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Settings</h1>
          <p>Configure workspace preferences and workflow notifications.</p>
        </div>
      </div>

      <form className="card settings-card" onSubmit={handleSubmit}>
        <div className="section-head">
          <div>
            <h2>Workspace Preferences</h2>
            <p>Changes apply to future workflow activity.</p>
          </div>
        </div>
        <div className="settings-form-grid">
          <label className="modal-field">
            <span>Workspace name</span>
            <input
              value={workspaceName}
              onChange={(event) => {
                setWorkspaceName(event.target.value);
                setIsSaved(false);
              }}
              required
            />
          </label>
          <label className="modal-field">
            <span>Default PIC role</span>
            <select
              value={defaultPic}
              onChange={(event) => {
                setDefaultPic(event.target.value);
                setIsSaved(false);
              }}
            >
              <option>Project Manager</option>
              <option>Designer</option>
              <option>Quality Control</option>
            </select>
          </label>
          <label className="modal-field">
            <span>Deadline reminder</span>
            <select
              value={deadlineReminder}
              onChange={(event) => {
                setDeadlineReminder(event.target.value);
                setIsSaved(false);
              }}
            >
              <option value="1">1 day before</option>
              <option value="3">3 days before</option>
              <option value="7">7 days before</option>
            </select>
          </label>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(event) => {
                setEmailNotifications(event.target.checked);
                setIsSaved(false);
              }}
            />
            <span>
              <strong>Email notifications</strong>
              <small>Send reminders when an order is approaching its deadline.</small>
            </span>
          </label>
        </div>
        <footer className="settings-actions">
          {isSaved ? <span className="settings-saved">Settings saved</span> : null}
          <Button type="submit" icon="settings">
            Save Settings
          </Button>
        </footer>
      </form>
    </>
  );
}
