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

type Customer = {
  id: string;
  name: string;
  organizationName: string;
  address?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean;
};

export default function CustomersPage() {
  const { status } = useSession({ required: true });
  const router = useRouter();
  const [rows, setRows] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") router.push("/");
  }, [status, router]);

  const refresh = async () => {
    const res = await axios.get<Customer[]>("/api/customers");
    setRows(res.data ?? []);
  };

  useEffect(() => {
    void refresh().catch(() => setRows([]));
  }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await axios.patch(`/api/customers/${id}`, { isActive });
      await refresh();
      customToast.success({
        title: "",
        description: isActive ? "Customer marked active." : "Customer marked inactive.",
      });
    } catch {
      customToast.error({ title: "", description: "Could not update status." });
    }
  };

  const create = async () => {
    if (!name.trim() || !organizationName.trim()) {
      customToast.error({ title: "", description: "Name and organization are required." });
      return;
    }
    try {
      await axios.post("/api/customers", {
        name: name.trim(),
        organizationName: organizationName.trim(),
        email: email.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
      });
      setName("");
      setOrganizationName("");
      setEmail("");
      setPhoneNumber("");
      await refresh();
      customToast.success({ title: "", description: "Customer created." });
    } catch {
      customToast.error({ title: "", description: "Could not create customer." });
    }
  };

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Members} windowTitle="Customers">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="linear-panel p-4 space-y-3">
          <h2 className="text-sm font-medium">Add customer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Contact name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              placeholder="Organization"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              placeholder="Phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <Button type="button" onClick={() => void create()}>
            Save customer
          </Button>
        </div>

        <div className="linear-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-(--surface-2) text-(--muted-2) text-left text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Organization</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-(--border) hover:bg-(--surface-2)">
                  <td className="px-3 py-2">{c.organizationName}</td>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2 text-(--muted)">{c.email ?? "—"}</td>
                  <td className="px-3 py-2 text-(--muted)">{c.phoneNumber ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StoreStatusBadge isActive={c.isActive !== false} />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-xs text-sky-700 hover:underline"
                      onClick={() => void toggleActive(c.id, c.isActive === false)}
                    >
                      {c.isActive === false ? "Mark active" : "Mark inactive"}
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
