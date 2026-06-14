export type FeatureItem = {
  heading: string;
  description: string;
  highlights: string[];
  icon: "tickets" | "store" | "delivery";
};

export const FeaturesArray: FeatureItem[] = [
  {
    heading: "Incident & change tickets",
    description:
      "Dedicated incident and change flows with ticket numbers, urgency-based due dates, SLA pause on hold, and CSV export.",
    highlights: ["INC / CHG numbering", "SLA-aware hold", "Role-gated actions"],
    icon: "tickets",
  },
  {
    heading: "Store directory",
    description:
      "Customers and employees in one place — link projects to active customers and keep your delivery roster current.",
    highlights: ["Active / inactive status", "Project customer link", "Team visibility"],
    icon: "store",
  },
  {
    heading: "Delivery workspace",
    description:
      "Projects, sprints, board, backlog, and timeline views so leads can see portfolio health without switching tools.",
    highlights: ["Sprint planning", "Kanban board", "Saved views"],
    icon: "delivery",
  },
];
