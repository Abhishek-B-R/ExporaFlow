"use client";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import axios from "axios";
import { useRef, useState, useEffect } from "react";
import { TicketType } from "@prisma/client";
import { statusesForTicketType } from "@/lib/issue-status-machine";
import { EnterpriseDatePicker } from "@/components/workflow/enterprise-date-picker";
import { renderPrioritySvg, RenderStatusSvg } from "./issue-label";
import { PriorityOptionsArray } from "@/utils/issues-view-options";
import { customToast } from "@/lib/custom-toast";

type DuplicateCandidate = {
  id: string;
  title: string;
  status?: string | null;
  score: number;
};

export const CreateIssueWindow = ({
  setClose,
  project_id,
  project_title,
  onCreated,
}: {
  setClose: React.Dispatch<React.SetStateAction<boolean>>;
  project_id: string | null;
  project_title: string | undefined;
  onCreated?: () => void | Promise<void>;
}) => {
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [selectedPriorityOption, setSelectedPriorityOption] =
    useState("No Priority");
  const [selectedStatusOption, setSelectedStatusOption] = useState("Working");
  const [showOptionsDropdown, setShowOptionsDropdown] = useState<
    "status" | "priority" | boolean
  >(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // AI states
  const [isDrafting, setIsDrafting] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageSuggestion, setTriageSuggestion] = useState<{
    priority: string;
    severity: string;
    routingTeamHint: string;
    effortHint: string;
    risk: string;
    rationale: string;
  } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCandidate | null>(null);

  const [ticketType, setTicketType] = useState<TicketType>(TicketType.INCIDENT);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");

  useEffect(() => {
    const allowed = statusesForTicketType(ticketType);
    setSelectedStatusOption((prev) =>
      allowed.includes(prev) ? prev : (allowed[0] ?? "Backlog"),
    );
  }, [ticketType]);

  const createIssue = async () => {
    try {
      const response = await axios.post("/api/issues/createissue", {
        issueTitle: issueTitle,
        issueDescription: issueDescription,
        issueStatus: selectedStatusOption,
        issuePriority: selectedPriorityOption,
        projectId: project_id,
        ticketType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        durationMinutes: durationMinutes
          ? Number.parseInt(durationMinutes, 10)
          : undefined,
      });

      if (response.data) {
        customToast.success({
          title: "Success",
          description: "Ticket created successfully",
        });
        await onCreated?.();
        setClose(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const dup = error.response.data?.duplicate;
        if (dup) {
          setDuplicateWarning({
            id: dup.id,
            title: dup.title,
            status: dup.status,
            score: dup.score ?? 1,
          });
          return;
        }
      }
      const description = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Failed to create issue, try again."
        : "Failed to create issue, try again.";
      customToast.error({
        title: "Action failed",
        description,
      });
    }
  };

  const aiDraft = async () => {
    const rawText = `${issueTitle}\n${issueDescription}`.trim();
    if (!rawText) {
      customToast.error({ title: "", description: "Type something first so AI can draft an issue." });
      return;
    }
    try {
      setIsDrafting(true);
      const res = await axios.post("/api/ai/draft", { text: rawText });
      const draft = res.data?.draft;
      if (draft) {
        setIssueTitle(draft.title ?? issueTitle);
        setIssueDescription(draft.description ?? issueDescription);
        if (draft.priority && draft.priority !== "No Priority") {
          setSelectedPriorityOption(draft.priority);
        }
        if (draft.status) {
          setSelectedStatusOption(draft.status);
        }
        customToast.success({ title: "AI Draft", description: "Issue drafted by AI. Review and edit before creating." });
      }
    } catch {
      customToast.error({ title: "", description: "AI drafting failed." });
    } finally {
      setIsDrafting(false);
    }
  };

  const aiTriage = async () => {
    if (!issueTitle.trim()) {
      customToast.error({ title: "", description: "Add a title first for AI triage." });
      return;
    }
    try {
      setIsTriaging(true);
      const res = await axios.post("/api/ai/triage", {
        title: issueTitle,
        description: issueDescription,
      });
      const suggestions = res.data?.suggestions;
      if (suggestions) {
        setTriageSuggestion(suggestions);
      }
    } catch {
      customToast.error({ title: "", description: "AI triage failed." });
    } finally {
      setIsTriaging(false);
    }
  };

  const applyTriageSuggestion = () => {
    if (!triageSuggestion) return;
    setSelectedPriorityOption(triageSuggestion.priority);
    setTriageSuggestion(null);
    customToast.success({ title: "", description: "Applied AI triage suggestion." });
  };

  const handlePriorityOptionClick = async (option: string) => {
    setSelectedPriorityOption(option);
    setShowOptionsDropdown(false);
  };

  const handleStatusOptionClick = async (option: string) => {
    setSelectedStatusOption(option);
    setShowOptionsDropdown(false);
  };

  return (
    <div className="absolute bg-[rgba(0,0,0,0.1)] backdrop-blur-lg w-full min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-14 xl:px-44 z-40">
      {/* Issue Box */}
      <div className="border border-[#393B42] bg-[#0F1111] rounded-xl w-[95%] xl:w-[70%] p-4 flex flex-col max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center">
            <div className="w-20 border border-[#2D3035] h-8 rounded-lg flex items-center justify-center font-medium">
              {project_title?.toUpperCase().slice(0, 3)}
            </div>
            <SVGIcon svgString={RAW_ICONS.ArrowRight} />
            <p className="font-medium text-lg">New ticket</p>
          </div>
          <div
            onClick={() => {
              setClose(false);
            }}
            className="p-1 rounded-md hover:bg-[#2D3035] transition-all duration-200"
          >
            <SVGIcon className="flex" svgString={RAW_ICONS.Close} />
          </div>
        </div>
        <input
          className="mt-4 text-2xl flex-shrink-0 outline-none bg-transparent"
          onChange={(e) => {
            setIssueTitle(e.target.value);
            setDuplicateWarning(null);
          }}
          placeholder="Ticket title"
          value={issueTitle}
        />
        <textarea
          className="w-full mt-4 text-lg outline-none flex-1 resize-none min-h-[120px] bg-transparent"
          onChange={(e) => {
            setIssueDescription(e.target.value);
          }}
          placeholder="Ticket description"
          name="description"
          value={issueDescription}
        ></textarea>

        <div className="mt-4 space-y-3">
          <p className="text-xs text-[#a4a6aa] uppercase tracking-wide">Ticket type</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { t: TicketType.INCIDENT, label: "Incident management" },
                { t: TicketType.CHANGE, label: "Change management" },
              ] as const
            ).map(({ t, label }) => (
              <button
                key={t}
                type="button"
                onClick={() => setTicketType(t)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  ticketType === t
                    ? "border-[#4f6bed] bg-[#4f6bed]/15 text-white"
                    : "border-[#6A6C75] bg-[#1f2025] text-[#caccd4] hover:bg-[#212227]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {ticketType === TicketType.CHANGE ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <EnterpriseDatePicker
                label="Start date *"
                value={startDate}
                onChange={setStartDate}
              />
              <EnterpriseDatePicker
                label="End date"
                value={endDate}
                onChange={setEndDate}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#a4a6aa]">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  className="h-10 rounded-md border border-[#6A6C75] bg-[#1f2025] px-3 text-sm"
                  placeholder="If no end date"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Duplicate warning */}
        {duplicateWarning && (
          <div className="mt-3 rounded-lg border border-[#e05f5f]/40 bg-[#e05f5f]/10 p-3 text-sm">
            <p className="font-medium text-[#e05f5f]">Possible duplicate detected</p>
            <p className="text-[#a4a6aa] mt-1">
              &quot;{duplicateWarning.title}&quot; ({duplicateWarning.status ?? "Open"}) — {Math.round(duplicateWarning.score * 100)}% match
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="text-xs px-2 py-1 rounded border border-[#e05f5f]/30 hover:bg-[#e05f5f]/20"
              >
                Create anyway
              </button>
              <button
                onClick={() => {
                  setDuplicateWarning(null);
                  setClose(false);
                }}
                className="text-xs px-2 py-1 rounded border border-[#6A6C75] hover:bg-[#2D3035]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* AI Triage Suggestion Panel */}
        {triageSuggestion && (
          <div className="mt-3 rounded-lg border border-[#6f86ff]/30 bg-[#6f86ff]/5 p-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium text-[#6f86ff]">AI Triage Suggestion</p>
              <button
                onClick={() => setTriageSuggestion(null)}
                className="text-xs text-[#a4a6aa] hover:text-white"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs text-[#caccd4]">
              <div>
                <span className="text-[#a4a6aa]">Priority:</span> {triageSuggestion.priority}
              </div>
              <div>
                <span className="text-[#a4a6aa]">Severity:</span> {triageSuggestion.severity}
              </div>
              <div>
                <span className="text-[#a4a6aa]">Effort:</span> {triageSuggestion.effortHint}
              </div>
              <div>
                <span className="text-[#a4a6aa]">Team:</span> {triageSuggestion.routingTeamHint}
              </div>
              <div className="col-span-2">
                <span className="text-[#a4a6aa]">Risk:</span> {triageSuggestion.risk}
              </div>
            </div>
            <p className="text-xs text-[#a4a6aa] mt-2">{triageSuggestion.rationale}</p>
            <button
              onClick={applyTriageSuggestion}
              className="mt-2 text-xs px-2 py-1 rounded border border-[#6f86ff]/40 bg-[#6f86ff]/10 hover:bg-[#6f86ff]/20 text-[#6f86ff]"
            >
              Apply priority suggestion
            </button>
          </div>
        )}

        <div className="h-fit my-4 items-center flex text-[#caccd4]">
          <div className="flex items-center gap-x-2 flex-wrap">
            <div className=" relative" ref={dropdownRef}>
              <div
                className="flex border border-[#6A6C75] bg-[#1f2025] items-center text-sm justify-center h-7 w-8 rounded-md hover:bg-[#212227] transition-all duration-300 cursor-pointer"
                onClick={() =>
                  setShowOptionsDropdown(
                    showOptionsDropdown == "priority" ? false : "priority"
                  )
                }
              >
                {renderPrioritySvg(selectedPriorityOption)}
              </div>
              {showOptionsDropdown == "priority" && (
                <div className="absolute w-36 top-full left-0 bg-[rgba(0,0,0,0.1)] backdrop-blur-lg border border-[#414141] rounded-lg shadow-lg mt-1 z-10">
                  {PriorityOptionsArray.map((option, key) => (
                    <div
                      key={key}
                      className="px-2 py-2 hover:bg-[#151818] cursor-pointer text-white flex items-center  gap-x-2"
                      onClick={() => handlePriorityOptionClick(option.name)}
                    >
                      <SVGIcon className="flex w-4" svgString={option.svg} />
                      <p className="text-sm">{option.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-1 relative" ref={dropdownRef}>
              <div
                className="flex border border-[#6A6C75] bg-[#1f2025] items-center text-sm justify-center h-7 w-8 rounded-md hover:bg-[#212227] transition-all duration-300 cursor-pointer"
                onClick={() =>
                  setShowOptionsDropdown(
                    showOptionsDropdown == "status" ? false : "status"
                  )
                }
              >
                <RenderStatusSvg status={selectedStatusOption} />
              </div>
              {showOptionsDropdown == "status" && (
                <div className="absolute w-36 top-full left-0 bg-[rgba(0,0,0,0.1)] backdrop-blur-lg border border-[#414141] rounded-lg shadow-lg mt-1 z-10">
                  {statusesForTicketType(ticketType).map((optionTitle) => (
                    <div
                      key={optionTitle}
                      className="px-2 flex gap-x-2 rounded-lg items-center py-2 hover:bg-[#151818] cursor-pointer text-white text-sm"
                      onClick={() => handleStatusOptionClick(optionTitle)}
                    >
                      <RenderStatusSvg status={optionTitle} />
                      <p>{optionTitle}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="border border-[#696c75] bg-[#1f2025] rounded-md text-sm px-2 h-7">
              Assignee
            </button>

            {/* AI Buttons */}
            <button
              onClick={aiDraft}
              disabled={isDrafting}
              className="border border-[#6f86ff]/30 bg-[#6f86ff]/10 text-[#6f86ff] rounded-md text-sm px-2 h-7 hover:bg-[#6f86ff]/20 transition-colors disabled:opacity-50"
            >
              {isDrafting ? "Drafting…" : "✨ AI Draft"}
            </button>
            <button
              onClick={aiTriage}
              disabled={isTriaging}
              className="border border-[#7c5cff]/30 bg-[#7c5cff]/10 text-[#7c5cff] rounded-md text-sm px-2 h-7 hover:bg-[#7c5cff]/20 transition-colors disabled:opacity-50"
            >
              {isTriaging ? "Triaging…" : "⚡ AI Triage"}
            </button>
          </div>
        </div>
        <div className=" justify-end flex items-center">
          <button
            onClick={createIssue}
            className="bg-gradient-to-b from-[#6A6C75] to-[#35373E] text-white  px-2 rounded-md h-8"
          >
            Create ticket
          </button>
        </div>
      </div>
    </div>
  );
};
