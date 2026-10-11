import { Icon } from "@/components/ui/icon";
import { isActiveProject } from "@/lib/active-project";
import type { Order } from "@/types/order";

const designers = [
  { name: "Ihsan", initials: "IH", role: "Senior Graphic Designer", avatar: "blue", capacity: 10 },
  { name: "Aldo", initials: "AL", role: "Graphic Designer", avatar: "amber", capacity: 10 },
  { name: "Dimas", initials: "DM", role: "Junior Graphic Designer", avatar: "green", capacity: 10 },
] as const;
const dueSoonDays = 3;

function jakartaDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

function deadlineDay(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return Date.parse(`${value}T00:00:00Z`);
  const match = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(value);
  if (!match) return NaN;
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(match[2]);
  return month < 0 ? NaN : Date.UTC(Number(match[3]), month, Number(match[1]));
}

export function DesignerWorkload({ orders }: { orders: Order[] }) {
  const today = jakartaDate(new Date());
  const todayDay = Date.parse(`${today}T00:00:00Z`);
  return (
    <section className="card designer-workload" aria-labelledby="designer-workload-title">
      <div className="section-head">
        <div><h2 id="designer-workload-title">Designer Workload</h2><p>Project assignments and available capacity by designer.</p></div>
      </div>
      <div className="designer-workload-grid">
        {designers.map((designer) => {
          const assigned = orders.filter((order) => order.pic.trim().toLowerCase() === designer.name.toLowerCase());
          const active = assigned.filter(isActiveProject);
          const atRisk = active.filter((order) => deadlineDay(order.deadline) < todayDay).length;
          const dueSoon = active.filter((order) => {
            const days = (deadlineDay(order.deadline) - todayDay) / 86400000;
            return days >= 0 && days <= dueSoonDays;
          }).length;
          const completed = assigned.filter((order) => {
            if (order.stage !== "completed" || order.workflow.currentStatus === "cancelled") return false;
            const completion = [...order.processHistory].reverse().find((record) => record.status === "Completed" || record.status === "completed");
            const date = new Date(completion?.date ?? order.updatedAt);
            return !Number.isNaN(date.getTime()) && jakartaDate(date).slice(0, 7) === today.slice(0, 7);
          }).length;
          const used = Math.round(active.length / designer.capacity * 100);
          const tone = used >= 70 ? "amber" : used >= 60 ? "blue" : "green";
          const status = used >= 100 ? "At Capacity" : used >= 70 ? "Almost Full" : used >= 60 ? "Normal" : "Capacity Available";
          return (
            <article className={`designer-workload-card workload-${tone}`} key={designer.name}>
              <header className="workload-designer">
                <span className={`workload-avatar avatar-${designer.avatar}`}>{designer.initials}</span>
                <div><h3>{designer.name}</h3><p>{designer.role}</p><span className="workload-capacity-status"><Icon name={used >= 70 ? "alert" : "check"} size={12} />{status}</span></div>
              </header>
              <div className="workload-capacity">
                <div><span>Capacity</span><strong>{active.length}/{designer.capacity} projects</strong></div>
                <div className="workload-track" role="progressbar" aria-label={`${designer.name} capacity used`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(used, 100)} aria-valuetext={`${used}% used`}><span style={{ width: `${Math.min(used, 100)}%` }} /></div>
                <small>{used}% used</small>
              </div>
              <dl className="workload-metrics">
                <div><dt>On Track</dt><dd className="metric-green">{active.length - atRisk}</dd></div>
                <div title="Active projects past their deadline"><dt>At Risk</dt><dd className="metric-red">{atRisk}</dd></div>
                <div title={`Projects due within ${dueSoonDays} days`}><dt>Due Soon</dt><dd className="metric-amber">{dueSoon}</dd></div>
                <div><dt>Completed This Month</dt><dd className="metric-blue">{completed}</dd></div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
