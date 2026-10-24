"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icon";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import type { Order, WorkflowStage } from "@/types/order";

type LandingWorkflowColumn = {
  id: "drawing" | "preparation" | "sample" | "closing";
  title: string;
  subtitle: string;
  icon: IconName;
  tone: "blue" | "amber" | "violet" | "green";
  stages: readonly WorkflowStage[];
};

const landingWorkflowColumns: readonly LandingWorkflowColumn[] = [
  {
    id: "drawing",
    title: "Drawing",
    subtitle: "Incoming designs, progress, and approvals",
    icon: "pen",
    tone: "blue",
    stages: ["order", "design-incoming", "design-progress", "review-approval"],
  },
  {
    id: "preparation",
    title: "Preparation",
    subtitle: "Tooling, materials, and offset preparation",
    icon: "settings",
    tone: "amber",
    stages: [
      "tooling-progress",
      "rubber-order-setting",
      "material-request",
      "offset-design",
      "offset-prepress",
      "offset-material-request",
      "offset-plate",
      "offset-varnish",
      "offset-press",
    ],
  },
  {
    id: "sample",
    title: "Sample Process",
    subtitle: "Sample preparation and evaluation",
    icon: "flask",
    tone: "violet",
    stages: ["sample-progress"],
  },
  {
    id: "closing",
    title: "Closing",
    subtitle: "Quality control, sample finalization, and production",
    icon: "check",
    tone: "green",
    stages: [
      "quality-control",
      "fa-report",
      "submit-sample",
      "sample-completed",
      "order-production",
    ],
  },
];

type LandingWorkflowCardProps = {
  column: LandingWorkflowColumn;
  orders: Order[];
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function projectMonth(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function LandingWorkflowCard({ column, orders }: LandingWorkflowCardProps) {
  return (
    <article className={`landing-workflow-card landing-card-${column.tone}`}>
      <header className="landing-card-header">
        <span className="landing-card-icon">
          <Icon name={column.icon} size={19} />
        </span>
        <div>
          <h2>{column.title}</h2>
          <p>{column.subtitle}</p>
        </div>
        <span className="landing-card-count" aria-label={`${orders.length} active ${orders.length === 1 ? "order" : "orders"}`}>
          {orders.length}
        </span>
      </header>

      <div className="landing-order-list">
        {orders.length ? (
          orders.map((order) => (
            <article className="landing-order" key={order.id}>
              <div className="landing-order-title">
                <strong>{order.product}</strong>
                <Badge tone={order.tone}>{order.status}</Badge>
              </div>
              <dl className="landing-order-details">
                <div>
                  <dt>Order code</dt>
                  <dd className="landing-order-code">{order.no}</dd>
                </div>
                <div>
                  <dt>Customer</dt>
                  <dd>{order.customer}</dd>
                </div>
                <div>
                  <dt>Due date</dt>
                  <dd>{order.deadline}</dd>
                </div>
                <div>
                  <dt>Project date</dt>
                  <dd>{order.projectDate}</dd>
                </div>
                <div>
                  <dt>PIC</dt>
                  <dd>{order.pic}</dd>
                </div>
                <div className="landing-status-detail">
                  <dt>Status</dt>
                  <dd>
                    <Badge tone={order.tone}>{order.status}</Badge>
                  </dd>
                </div>
              </dl>
            </article>
          ))
        ) : (
          <div className="landing-empty-card">
            <Icon name={column.icon} size={20} />
            <p>No active orders match the selected months.</p>
          </div>
        )}
      </div>
    </article>
  );
}

/** Public, live overview of every project that has not reached the final archive. */
export function LandingView() {
  const { orders } = useWorkflowOrders();
  const [openMonth, setOpenMonth] = useState(currentMonth);
  const [closeMonth, setCloseMonth] = useState(currentMonth);
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) => {
          const month = projectMonth(order.projectDate);
          return order.stage !== "completed" &&
            order.workflow.currentStatus !== "cancelled" &&
            Boolean(month) &&
            (!openMonth || month >= openMonth) &&
            (!closeMonth || month <= closeMonth);
        },
      ),
    [orders, openMonth, closeMonth],
  );
  const columnsWithOrders = useMemo(
    () =>
      landingWorkflowColumns.map((column) => ({
        ...column,
        orders: activeOrders.filter((order) => column.stages.includes(order.stage)),
      })),
    [activeOrders],
  );

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link className="landing-brand" href="/" aria-label="COTS home">
          <span className="landing-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>COTS</strong>
            <small>Customer Order Tracking System</small>
          </span>
        </Link>
        <Link className="landing-login" href="/login">
          Login
          <Icon name="arrow" size={16} />
        </Link>
      </header>

      <main className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div>
            <span className="landing-eyebrow">
              <span aria-hidden="true" />
              LIVE ORDER BOARD
            </span>
            <h1 id="landing-title">Track orders in progress.</h1>
            <p>
              All active orders are organized by their current workflow stage,
              from drawing to closing.
            </p>
          </div>
          <div className="landing-live-summary">
            <span>
              <Icon name="clock" size={20} />
            </span>
            <div>
              <strong>{activeOrders.length}</strong>
              <small>Active orders in selected months</small>
            </div>
          </div>
        </section>

        <section className="landing-board" aria-labelledby="active-orders-title">

          <div className="landing-month-filters" role="group" aria-label="Filter by project month">
            <label>
              <span>Open Month</span>
              <input
                type="month"
                value={openMonth}
                max={closeMonth || undefined}
                onChange={(event) => {
                  const value = event.target.value;
                  setOpenMonth(value);
                  if (value && closeMonth && value > closeMonth) setCloseMonth(value);
                }}
              />
            </label>
            <label>
              <span>Close Month</span>
              <input
                type="month"
                value={closeMonth}
                min={openMonth || undefined}
                onChange={(event) => {
                  const value = event.target.value;
                  setCloseMonth(value);
                  if (value && openMonth && value < openMonth) setOpenMonth(value);
                }}
              />
            </label>
            <p>Filter by project date, including both selected months.</p>
          </div>

          <div className="landing-board-scroll">
            <div className="landing-workflow-grid">
              {columnsWithOrders.map((column) => (
                <LandingWorkflowCard
                  key={column.id}
                  column={column}
                  orders={column.orders}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
