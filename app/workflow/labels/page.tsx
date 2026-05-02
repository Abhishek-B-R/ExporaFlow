"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import { useEffect, useState } from "react";

const PRESET_COLORS = [
  "#6f86ff", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4",
  "#a855f7", "#ec4899", "#f97316", "#14b8a6", "#8b5cf6",
];

type Label = {
  id: string;
  name: string;
  color: string;
  description?: string | null;
};

export default function LabelsPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6f86ff");
  const [description, setDescription] = useState("");

  const fetchLabels = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/labels");
      setLabels(res.data ?? []);
    } catch {
      customToast.error({ title: "", description: "Failed to load labels." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      setIsSubmitting(true);
      await axios.post("/api/labels", { name: name.trim(), color, description: description.trim() || null });
      customToast.success({ title: "", description: `Label "${name.trim()}" created.` });
      setName("");
      setDescription("");
      setColor("#6f86ff");
      await fetchLabels();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to create label.";
      customToast.error({ title: "", description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (labelId: string, labelName: string) => {
    try {
      await axios.delete("/api/labels", { data: { labelId } });
      customToast.success({ title: "", description: `Label "${labelName}" deleted.` });
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
    } catch {
      customToast.error({ title: "", description: "Failed to delete label." });
    }
  };

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Label} windowTitle="Labels">
      <div className="grow overflow-y-auto px-4 md:px-8 py-6">
        {/* Create label */}
        <div className="rounded-xl border border-(--border) bg-(--surface-1) p-5 max-w-2xl">
          <p className="text-base font-medium mb-4">Create a label</p>

          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Label name"
                className="grow rounded-md border border-(--border) bg-(--surface-2) px-3 h-9 text-sm outline-none"
              />
            </div>

            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-md border border-(--border) bg-(--surface-2) px-3 h-9 text-sm outline-none"
            />

            {/* Color picker */}
            <div>
              <p className="text-xs text-(--muted-2) mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${
                      color === c ? "border-white scale-110" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-7 w-7 rounded-full cursor-pointer bg-transparent border-0"
                  title="Custom color"
                />
              </div>
            </div>

            {/* Preview */}
            {name.trim() && (
              <div className="flex items-center gap-2 pt-1">
                <p className="text-xs text-(--muted-2)">Preview:</p>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full border font-medium"
                  style={{
                    backgroundColor: `${color}20`,
                    borderColor: `${color}40`,
                    color: color,
                  }}
                >
                  {name.trim()}
                </span>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={isSubmitting || !name.trim()}
              className="h-9 px-4 rounded-md bg-[#6f86ff] hover:bg-[#5a70e6] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create label"}
            </button>
          </div>
        </div>

        {/* Labels list */}
        <div className="mt-8 max-w-2xl">
          <p className="text-base font-medium mb-3">
            All labels {!isLoading && <span className="text-(--muted-2) text-sm font-normal">({labels.length})</span>}
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-md bg-(--surface-2) animate-pulse" />
              ))}
            </div>
          ) : labels.length === 0 ? (
            <div className="rounded-xl border border-(--border) bg-(--surface-1) p-6 text-center">
              <p className="text-sm text-(--muted-2)">No labels yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between px-4 py-3 rounded-md border border-(--border) bg-(--surface-1) hover:bg-(--surface-2) transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <div>
                      <span
                        className="text-sm font-medium px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${label.color}20`,
                          borderColor: `${label.color}40`,
                          color: label.color,
                        }}
                      >
                        {label.name}
                      </span>
                      {label.description && (
                        <p className="text-xs text-(--muted-2) mt-1 ml-2">{label.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(label.id, label.name)}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkflowLayout>
  );
}
