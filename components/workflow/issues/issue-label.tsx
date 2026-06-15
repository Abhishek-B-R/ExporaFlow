import { customToast } from "@/lib/custom-toast";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import { IssueStatus } from "@/utils/issues-view-options";
import { HOLD_STATUS, statusesForTicketType } from "@/lib/issue-status-machine";
import { TicketType } from "@prisma/client";
import { formatTicketKey } from "@/lib/ticket-display";
import { isChangeManagementType } from "@/lib/ticket-types";
import { ticketTypeBadgeClass, ticketTypeLabel } from "@/lib/ticket-type-labels";
import { isTicketOverdue, slaCountdownLabel } from "@/lib/sla-countdown";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function statusMenuEntry(title: string): { title: string; svg: string } {
  const known = IssueStatus.find((i) => i.title === title);
  if (known) return known;
  if (title === HOLD_STATUS)
    return { title: HOLD_STATUS, svg: RAW_ICONS.Label };
  return { title, svg: RAW_ICONS.Todo };
}

export default function IssueLabel({
  title,
  description,
  projectKey,
  priority,
  createdAt,
  status,
  update,
  assigedUser,
  assigneeInfo,
  projectID,
  issueID,
  updatedAt,
  selected,
  ticketType,
  ticketNumber,
  globalTicketNumber,
  dueDate,
  issueStatus,
  canChangeStatus = false,
  canChangePriority = false,
}: {
  title: string;
  description?: string;
  projectKey?: string;
  priority?: string;
  createdAt?: string;
  status?: string;
  update?: string;
  assigedUser?: string;
  assigneeInfo?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  projectID: string | null;
  issueID: string;
  updatedAt?: string;
  selected?: boolean;
  ticketType?: TicketType | string | null;
  ticketNumber?: number | null;
  globalTicketNumber?: number | null;
  dueDate?: string | null;
  /** Ticket status for overdue calculation (avoids shadowing `status` prop). */
  issueStatus?: string | null;
  canChangeStatus?: boolean;
  canChangePriority?: boolean;
}) {
  const date = new Date(updatedAt ? updatedAt : "");
  const router = useRouter();
  // Display: "12 May"
  const shortDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  // Tooltip: "12 May 2025, 01:18 PM"
  const fullDate = date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const [selectedStatusOption, setSelectedStatusOption] = useState(status);

  useEffect(() => {
    setSelectedStatusOption(status);
  }, [status]);

  const ticketTypeEnum = isChangeManagementType(ticketType)
    ? TicketType.CHANGE
    : TicketType.INCIDENT;

  const statusMenu = statusesForTicketType(ticketTypeEnum).map(statusMenuEntry);

  const onHoldChange =
    (selectedStatusOption ?? "").toLowerCase() === "hold" &&
    ticketTypeEnum === TicketType.CHANGE;

  const [showOptionsDropdown, setShowOptionsDropdown] = useState<
    "status" | "priority" | boolean
  >(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedPriorityOption, setSelectedPriorityOption] = useState(
    priority ? priority : "No Priority",
  );

  const priorityOptionsArray = [
    { name: "Urgent", svg: RAW_ICONS.UrgentPriority },
    { name: "No Priority", svg: RAW_ICONS.NoPriority },
    { name: "High", svg: RAW_ICONS.HighPriority },
    { name: "Medium", svg: RAW_ICONS.MediumPriority },
    { name: "Low", svg: RAW_ICONS.LowPriority },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showOptionsDropdown === "status" &&
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowOptionsDropdown(false);
      }

      if (
        showOptionsDropdown === "priority" &&
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target as Node)
      ) {
        setShowOptionsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionsDropdown]);

  const handleStatusOptionClick = async (option: string) => {
    const previousStatus = selectedStatusOption;
    setSelectedStatusOption(option);

    setShowOptionsDropdown(false);
    try {
      const response = await axios.patch("/api/issues/updateissue", {
        issueId: issueID,
        issueStatus: option,
      });
      if (response.status === 200) {
        customToast.info({
          title: "Status changed!",
          description: `Status set to ${option} successfully.`,
        });
      } else {
        customToast.error({
          title: "",
          description: "Failed to update issue.",
        });
      }
    } catch (error) {
      setSelectedStatusOption(previousStatus);
      console.error("Error updating project:", error);
      const description = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? "Failed to update issue.")
        : "Failed to update issue.";
      customToast.error({
        title: "",
        description,
      });
    }
  };

  const handlePriorityOptionClick = async (option: string) => {
    setSelectedPriorityOption(option);
    setShowOptionsDropdown(false);
    try {
      const response = await axios.patch("/api/issues/updateissue", {
        issueId: issueID,
        issuePriority: option,
      });
      if (response.status === 200) {
        customToast.info({
          title: "Priority changed!",
          description: `Priority set to ${option} successfully.`,
        });
      } else {
        customToast.error({
          title: "",
          description: "Failed to update issue.",
        });
      }
    } catch (error) {
      console.error("Error updating project:", error);
      customToast.error({
        title: "",
        description: "Failed to update issue.",
      });
    }
  };

  const assigneeName = assigneeInfo?.name || assigneeInfo?.email || null;
  const assigneeInitial = assigneeName
    ? assigneeName.charAt(0).toUpperCase()
    : null;
  const ticketKey = formatTicketKey({ ticketType, ticketNumber, globalTicketNumber });
  const overdue = isTicketOverdue({ dueDate, status: issueStatus ?? status });
  const slaLabel = slaCountdownLabel({ dueDate });

  return (
    <div
      className={`h-12 rounded-md border transition-colors duration-150 px-3 grid grid-cols-12 items-center text-xs md:text-sm xl:text-[15px] cursor-pointer ${
        selected
          ? "bg-(--surface-3) border-(--border-strong)"
          : overdue
            ? "border-red-200 bg-red-50/40 hover:bg-red-50/70"
            : "border-transparent hover:bg-(--surface-2) hover:border-(--border)"
      }`}
      onClick={() => {
        if (projectID) {
          router.push(
            `/workflow/project/${projectID}/incident-tickets/${issueID}`,
          );
        }
      }}
    >
      <div className=" col-span-5 sm:col-span-4 flex items-center gap-x-3 min-w-0 ">
        {status ? (
          <RenderStatusSvg status={status} />
        ) : (
          <div className="border rounded-full h-5 w-5 shrink-0 border-(--border)" />
        )}
        <div className="min-w-0 flex items-center gap-2 flex-1">
          {ticketKey ? (
            <span className="shrink-0 font-mono text-[10px] text-(--muted-2)">
              {ticketKey}
            </span>
          ) : null}
          {ticketType ? (
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${ticketTypeBadgeClass(ticketType)}`}
            >
              {ticketTypeLabel(ticketType)}
            </span>
          ) : null}
          {slaLabel ? (
            <span
              className={`shrink-0 text-[10px] font-medium ${
                overdue ? "text-red-700" : "text-(--muted-2)"
              }`}
              title={dueDate ? new Date(dueDate).toLocaleString() : undefined}
            >
              {slaLabel}
            </span>
          ) : null}
          {onHoldChange ? (
            <span className="shrink-0 rounded border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              Hold
            </span>
          ) : null}
          {projectID ? (
            <Link
              href={`/workflow/project/${projectID}/incident-tickets/${issueID}`}
              className="text-sm xl:text-[15px] hover:underline truncate text-(--foreground)"
              onClick={(e) => e.stopPropagation()}
            >
              {title}
            </Link>
          ) : (
            <p className="text-sm xl:text-[15px] truncate text-(--foreground)">
              {title}
            </p>
          )}
        </div>
      </div>
      <p
        className="hidden sm:block col-span-1 cursor-pointer"
        title={projectKey}
      >
        {projectKey ? projectKey.slice(0, 3).toUpperCase() : "ZEN-1"}
      </p>
      <div className="col-span-1 relative " ref={statusDropdownRef}>
        {canChangeStatus ? (
          <>
            <div
              className="w-fit flex items-center px-2 h-8 rounded border border-transparent hover:bg-(--surface-3) transition-colors duration-150 cursor-pointer text-(--foreground)"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsDropdown(
                  showOptionsDropdown == "status" ? false : "status",
                );
              }}
            >
              {selectedStatusOption}
            </div>
            {showOptionsDropdown == "status" && (
              <div
                className="absolute w-40 top-full left-0 rounded-md border border-(--border) bg-(--surface-1) shadow-lg mt-1 z-50 py-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {statusMenu.map((option, key) => (
                  <div
                    key={key}
                    className="px-2 flex gap-x-2 rounded items-center h-8 hover:bg-(--surface-2) cursor-pointer text-(--foreground) text-[13px]"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleStatusOptionClick(option.title);
                    }}
                  >
                    <SVGIcon className="flex w-4" svgString={option.svg} />
                    <p>{option.title}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            className="w-fit flex items-center px-2 h-8 text-(--muted) cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedStatusOption}
          </div>
        )}
      </div>
      <div className="col-span-1 relative " ref={priorityDropdownRef}>
        {canChangePriority ? (
          <>
            <div
              className="flex items-center justify-center h-8 w-8 rounded-md border border-transparent hover:bg-(--surface-3) transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsDropdown(
                  showOptionsDropdown == "priority" ? false : "priority",
                );
              }}
            >
              {renderPrioritySvg(selectedPriorityOption)}
            </div>
            {showOptionsDropdown == "priority" && (
              <div
                className="absolute w-40 top-full left-0 rounded-md border border-(--border) bg-(--surface-1) shadow-lg mt-1 z-50 py-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {priorityOptionsArray.map((option, key) => (
                  <div
                    key={key}
                    className="px-2 h-8 hover:bg-(--surface-2) cursor-pointer text-(--foreground) flex items-center gap-x-2 rounded text-[13px]"
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePriorityOptionClick(option.name);
                    }}
                  >
                    <SVGIcon className="flex w-4" svgString={option.svg} />
                    <p>{option.name}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            className="flex items-center justify-center h-8 w-8 cursor-default"
            onClick={(e) => e.stopPropagation()}
            title={selectedPriorityOption}
          >
            {renderPrioritySvg(selectedPriorityOption)}
          </div>
        )}
      </div>

      <div title={fullDate} className="col-span-1 cursor-pointer ">
        {shortDate}
      </div>
      <div className="col-span-1" title={assigneeName ?? "Unassigned"}>
        {assigneeInfo?.image ? (
          <img
            src={assigneeInfo.image}
            alt={assigneeName ?? ""}
            className="h-7 w-7 rounded-full object-cover border border-(--border)"
          />
        ) : assigneeInitial ? (
          <div className="h-7 w-7 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-xs font-medium text-sky-600">
            {assigneeInitial}
          </div>
        ) : (
          <div className="border border-(--border) h-7 w-7 rounded-full flex items-center justify-center hover:bg-(--surface-3) transition-all duration-200">
            <SVGIcon className="flex w-6" svgString={RAW_ICONS.AssignedUser} />
          </div>
        )}
      </div>
      <p className="col-span-3 truncate text-xs text-(--muted-2)">
        {assigneeName ? `Assigned to ${assigneeName.split(" ")[0]}` : ""}
      </p>
    </div>
  );
}

export const renderPrioritySvg = (priority: string) => {
  switch (priority.split(" ").join().toLowerCase()) {
    case "urgent":
      return (
        <SVGIcon className="flex w-4" svgString={RAW_ICONS.UrgentPriority} />
      );
    case "high":
      return (
        <SVGIcon className="flex w-4" svgString={RAW_ICONS.HighPriority} />
      );
    case "medium":
      return (
        <SVGIcon className="flex w-4" svgString={RAW_ICONS.MediumPriority} />
      );
    case "low":
      return <SVGIcon className="flex w-4" svgString={RAW_ICONS.LowPriority} />;
    default:
      return <SVGIcon className="flex w-4" svgString={RAW_ICONS.NoPriority} />;
  }
};

export const RenderStatusSvg = ({ status }: { status: string }) => {
  switch (status.split(" ").join().toLowerCase()) {
    case "working":
      return <SVGIcon className="flex w-5" svgString={RAW_ICONS.InProgress} />;
    case "completed":
      return (
        <SVGIcon className="flex w-5" svgString={RAW_ICONS.CompletedIssue} />
      );
    case "backlog":
      return (
        <SVGIcon className="flex w-5" svgString={RAW_ICONS.DashedCircle} />
      );
    case "cancelled":
      return (
        <SVGIcon className="flex w-5" svgString={RAW_ICONS.CancelledIssue} />
      );
    case "hold":
      return <SVGIcon className="flex w-5" svgString={RAW_ICONS.Label} />;
    case "planned":
      return (
        <SVGIcon className="flex w-5" svgString={RAW_ICONS.PlannedIssue} />
      );
    default:
      return <SVGIcon className="flex w-5" svgString={RAW_ICONS.Todo} />;
  }
};
