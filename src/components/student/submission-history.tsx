import { CheckCircle2, XCircle } from "lucide-react";

type SubmissionItem = {
  id: string;
  query: string;
  passed: boolean;
  createdAt: Date;
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function SubmissionHistory({
  submissions,
}: {
  submissions: SubmissionItem[];
}) {
  if (submissions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No attempts yet.</p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {submissions.map((submission) => (
        <li
          key={submission.id}
          className="flex items-center justify-between gap-4 px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2">
            {submission.passed ? (
              <CheckCircle2 className="size-4 shrink-0 text-green-600" />
            ) : (
              <XCircle className="text-muted-foreground size-4 shrink-0" />
            )}
            <code className="truncate font-mono text-xs">
              {submission.query.replace(/\s+/g, " ").trim()}
            </code>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatTime(submission.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
