import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-(--background) flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-(--border) bg-(--surface-1) p-8 text-center">
        <h1 className="text-xl font-semibold text-(--foreground) mb-2">
          Access not allowed
        </h1>
        <p className="text-sm text-(--muted-2) leading-relaxed mb-6">
          This workspace is private. You need an invitation from the workspace owner
          before you can sign in. If you received an invite email, open that link
          first, then sign in with the same email address.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/auth/signin"
            className="h-10 px-5 rounded-lg border border-(--border) text-sm font-medium hover:bg-(--surface-2) inline-flex items-center justify-center"
          >
            Back to sign in
          </Link>
          <Link
            href="/"
            className="h-10 px-5 rounded-lg ef-btn-primary text-sm inline-flex items-center justify-center"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
