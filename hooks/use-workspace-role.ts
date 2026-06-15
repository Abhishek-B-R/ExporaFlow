"use client";

import { canPerformProjectAction, type ProjectPermission } from "@/lib/rbac-permissions";
import { Role } from "@prisma/client";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

export function useWorkspaceRole() {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios
      .get<{ role: Role | null }>("/api/workflow/workspace-role")
      .then((res) => {
        if (!cancelled) setRole(res.data.role ?? null);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const can = useCallback(
    (permission: ProjectPermission) => canPerformProjectAction(role, permission),
    [role],
  );

  return { role, loading, can };
}
