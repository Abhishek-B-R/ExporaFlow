"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { StoreStatusBadge } from "@/components/workflow/store-status-badge";
import {
  StoreDirectoryFilterBar,
  type StoreDirectoryFilter,
} from "@/components/workflow/store-directory-filter";

type Employee = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  designation?: string | null;
  role: string;
  isActive?: boolean;
};

export default function EmployeesPage() {
  const { status } = useSession({ required: true });
  const router = useRouter();
  const [rows, setRows] = useState<Employee[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [designation, setDesignation] = useState("");
  const [statusFilter, setStatusFilter] = useState<StoreDirectoryFilter>("all");

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") router.push("/");
  }, [status, router]);

  const refresh = async () => {
    const res = await axios.get<Employee[]>(
      `/api/employees?status=${statusFilter}`,
    );
    setRows(res.data ?? []);
  };

  useEffect(() => {
    void refresh().catch(() => setRows([]));
  }, [statusFilter]);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await axios.patch(`/api/employees/${id}`, { isActive });
      await refresh();
      customToast.success({
        title: "",
        description: isActive ? "Employee marked active." : "Employee marked inactive.",
      });
    } catch {
      customToast.error({ title: "", description: "Could not update status." });
    }
  };

  const create = async () => {
    if (!fullName.trim() || !email.trim()) {
      customToast.error({ title: "", description: "Full name and email are required." });
      return;
    }
    try {
      await axios.post("/api/employees", {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || null,
        designation: designation.trim() || null,
      });
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setDesignation("");
      await refresh();
      customToast.success({ title: "", description: "Employee created." });
    } catch {
      customToast.error({ title: "", description: "Could not create employee." });
    }
  };

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Members} windowTitle="Employees">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="linear-panel p-4 space-y-3">
          <h2 className="text-sm font-medium">Add employee</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            <Input
              placeholder="Designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>
          <Button type="button" onClick={() => void create()}>
            Save employee
          </Button>
        </div>

        <StoreDirectoryFilterBar value={statusFilter} onChange={setStatusFilter} />

        <div className="linear-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-(--surface-2) text-(--muted-2) text-left text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Designation</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr
                  key={e.id}
                  className={`border-t border-(--border) hover:bg-(--surface-2) ${
                    e.isActive === false ? "opacity-70 bg-zinc-50/50" : ""
                  }`}
                >
                  <td className="px-3 py-2">{e.fullName}</td>
                  <td className="px-3 py-2 text-(--muted)">{e.email}</td>
                  <td className="px-3 py-2">{e.role}</td>
                  <td className="px-3 py-2 text-(--muted)">{e.designation ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StoreStatusBadge isActive={e.isActive !== false} />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-xs text-sky-700 hover:underline"
                      onClick={() => void toggleActive(e.id, e.isActive === false)}
                    >
                      {e.isActive === false ? "Mark active" : "Mark inactive"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WorkflowLayout>
  );
}
