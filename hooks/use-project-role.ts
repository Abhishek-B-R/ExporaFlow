"use client";

import { canPerformProjectAction, type ProjectPermission } from "@/lib/rbac-permissions";
import { Role } from "@prisma/client";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

export function useProjectRole(projectId: string | null | undefined) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(Boolean(projectId));

  useEffect(() => {
    if (!projectId) {
      setRole(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    axios
      .get<{ role: Role | null }>("/api/workflow/project-role", {
        params: { projectId },
      })
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
  }, [projectId]);

  const can = useCallback(
    (permission: ProjectPermission) => canPerformProjectAction(role, permission),
    [role],
  );

  return { role, loading, can };
}
