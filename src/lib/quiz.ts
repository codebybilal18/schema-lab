export type QuizTiming = {
  type: string;
  opensAt: Date | null;
  closesAt: Date | null;
};

export type QuizStatus = {
  isQuiz: boolean;
  open: boolean;
  label: string;
};

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function quizStatus(
  assignment: QuizTiming,
  now: Date = new Date(),
): QuizStatus {
  if (assignment.type !== "QUIZ") {
    return { isQuiz: false, open: true, label: "Practice" };
  }
  if (assignment.opensAt && now < assignment.opensAt) {
    return {
      isQuiz: true,
      open: false,
      label: `Opens ${formatDateTime(assignment.opensAt)}`,
    };
  }
  if (assignment.closesAt && now > assignment.closesAt) {
    return { isQuiz: true, open: false, label: "Closed" };
  }
  if (assignment.closesAt) {
    return {
      isQuiz: true,
      open: true,
      label: `Open until ${formatDateTime(assignment.closesAt)}`,
    };
  }
  return { isQuiz: true, open: true, label: "Open" };
}
