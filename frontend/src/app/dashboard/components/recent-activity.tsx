import { Icon, type IconName } from "@/components/ui/icon";
import { SectionHeader } from "@/components/ui/section-header";

type ActivityTone = "blue" | "green" | "amber";

export type ActivityItem = {
  title: string;
  meta: string;
  time: string;
  icon: IconName;
  tone: ActivityTone;
};

const recentActivity: ActivityItem[] = [
  {
    title: "Drawing submitted",
    meta: "ORD-2025-0842 • Andi Pratama",
    time: "12 min ago",
    icon: "pen",
    tone: "blue",
  },
  {
    title: "Drawing approved",
    meta: "ORD-2025-0834 • Sarah Wijaya",
    time: "48 min ago",
    icon: "check",
    tone: "green",
  },
  {
    title: "Revision requested",
    meta: "ORD-2025-0839 • Budi Santoso",
    time: "2 hours ago",
    icon: "alert",
    tone: "amber",
  },
  {
    title: "Sample completed",
    meta: "ORD-2025-0836 • Rizky Saputra",
    time: "4 hours ago",
    icon: "flask",
    tone: "blue",
  },
  {
    title: "QC inspection passed",
    meta: "ORD-2025-0828 • Maya Lestari",
    time: "Yesterday",
    icon: "shield",
    tone: "green",
  },
];

type RecentActivityProps = {
  items?: ActivityItem[];
};

/** Compact, reusable team-update feed for the dashboard. */
export function RecentActivity({
  items = recentActivity,
}: RecentActivityProps) {
  return (
    <section className="card activity-card">
      <SectionHeader
        title="Recent Activity"
        subtitle="Latest updates from your team"
      />
      <div className="activity-list">
        {items.map((item) => (
          <div className="activity-row" key={`${item.title}-${item.time}`}>
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
