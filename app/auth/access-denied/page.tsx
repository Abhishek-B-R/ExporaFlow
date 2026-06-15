import { AuthShell } from "@/components/auth/auth-shell";
import { getWorkspaceOwnerEmail } from "@/lib/workspace-access";
import { NotInvitedActions } from "./not-invited-actions";

export default function AccessDeniedPage() {
  const adminEmail = getWorkspaceOwnerEmail();

  return (
    <AuthShell
      kicker="Private workspace"
      title="You're not invited yet"
      lead="Only people invited by the admin can use ExporaFlow. Think this is a mistake? Reach out below and we'll get you sorted."
    >
      {adminEmail ? (
        <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-center mb-5">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-sky-800/70 mb-1">
            Workspace admin
          </p>
          <p className="text-sm font-medium text-sky-900">{adminEmail}</p>
        </div>
      ) : null}
      <NotInvitedActions adminEmail={adminEmail} />
    </AuthShell>
  );
}
