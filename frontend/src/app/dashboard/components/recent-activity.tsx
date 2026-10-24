import { Icon, type IconName } from "@/components/ui/icon";
import { SectionHeader } from "@/components/ui/section-header";

type ActivityTone = "blue" | "green" | "amber";

export type ActivityItem = {
  id?: string;
  title: string;
  meta: string;
  time: string;
  icon: IconName;
  tone: ActivityTone;
};

type RecentActivityProps = {
  items?: ActivityItem[];
};

/** Compact, reusable team-update feed for the dashboard. */
export function RecentActivity({
  items = [],
}: RecentActivityProps) {
  return (
    <section className="card activity-card">
      <SectionHeader
        title="Recent Activity"
        subtitle="Latest updates from your team"
      />
      <div className="activity-list">
        {!items.length ? <p className="submit-sample-note">No activity recorded yet.</p> : null}
        {items.map((item) => (
          <div className="activity-row" key={item.id ?? `${item.title}-${item.time}-${item.meta}`}>
            <div className={`activity-icon ${item.tone}`}>
              <Icon name={item.icon} size={16} />
            </div>
            <div>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
            </div>
            <small>{item.time}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
