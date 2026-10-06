"use client";

import Link from "next/link";
import { useMemo } from "react";
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
    subtitle: "Desain masuk, proses, dan keputusan desain",
    icon: "pen",
    tone: "blue",
    stages: ["order", "design-incoming", "design-progress", "review-approval"],
  },
  {
    id: "preparation",
    title: "Preparation",
    subtitle: "Tooling dan setting",
    icon: "settings",
    tone: "amber",
    stages: ["tooling-progress", "rubber-order-setting"],
  },
  {
    id: "sample",
    title: "Sample Proses",
    subtitle: "Pengerjaan dan evaluasi sample",
    icon: "flask",
    tone: "violet",
    stages: ["sample-progress"],
  },
  {
    id: "closing",
    title: "Closing",
    subtitle: "Finalisasi sample dan produksi",
    icon: "check",
    tone: "green",
    stages: ["sample-completed", "order-production"],
  },
];

type LandingWorkflowCardProps = {
  column: LandingWorkflowColumn;
  orders: Order[];
};

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
        <span className="landing-card-count" aria-label={`${orders.length} order aktif`}>
          {orders.length}
        </span>
      </header>

      <div className="landing-order-list">
        {orders.length ? (
          orders.map((order) => (
            <article className="landing-order" key={order.no}>
              <div className="landing-order-title">
                <strong>{order.product}</strong>
                <Badge tone={order.tone}>{order.status}</Badge>
              </div>
              <dl className="landing-order-details">
                <div>
                  <dt>Kode</dt>
                  <dd className="landing-order-code">{order.no}</dd>
                </div>
                <div>
                  <dt>Nama cust.</dt>
                  <dd>{order.customer}</dd>
                </div>
                <div>
                  <dt>Due date</dt>
                  <dd>{order.deadline}</dd>
                </div>
                <div>
                  <dt>Tanggal proyek</dt>
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
            <p>Belum ada order aktif.</p>
          </div>
        )}
      </div>
    </article>
  );
}

/** Public, live overview of every project that has not reached the final archive. */
export function LandingView() {
  const { orders } = useWorkflowOrders();
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.stage !== "completed" && order.workflow.currentStatus !== "cancelled",
      ),
    [orders],
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
            <h1 id="landing-title">Pantau order yang sedang berjalan.</h1>
            <p>
              Semua order aktif ditampilkan berdasarkan tahap pekerjaan saat ini,
              dari drawing hingga closing.
            </p>
          </div>
          <div className="landing-live-summary">
            <span>
              <Icon name="clock" size={20} />
            </span>
            <div>
              <strong>{activeOrders.length}</strong>
              <small>Order aktif saat ini</small>
            </div>
          </div>
        </section>

        <section className="landing-board" aria-labelledby="active-orders-title">
          <div className="landing-section-heading">
            <div>
              <h2 id="active-orders-title">Order sedang berjalan</h2>
              <p>Order selesai tidak ditampilkan pada halaman ini.</p>
            </div>
            <span className="landing-board-note">4 tahap aktif</span>
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
