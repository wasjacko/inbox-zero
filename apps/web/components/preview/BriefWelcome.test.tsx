// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BriefWelcome } from "./BriefWelcome";

const state = vi.hoisted(() => ({
  tasks: [] as Array<Record<string, string>>,
}));
vi.mock("@/providers/EmailAccountProvider", () => ({
  useAccount: () => ({
    emailAccount: { name: "Wassil Account", email: "wassil@example.com" },
  }),
}));
vi.mock("@/hooks/usePreloadedPageData", () => ({
  usePreloadedPageData: () => ({ data: { unreadEmails: 93 } }),
}));
vi.mock("@/hooks/useMueBriefTasks", () => ({
  useMueBriefTasks: () => ({ data: { tasks: state.tasks } }),
}));
vi.mock("@/hooks/useContactPhotos", () => ({
  useContactPhotos: () => ({ photos: {} }),
}));
afterEach(() => {
  cleanup();
  state.tasks = [];
});

it("keeps the brief quiet when Mue detects no real task", () => {
  render(<BriefWelcome freelancerName="Other" />);
  expect(screen.getByText("Bonjour Wassil")).toBeTruthy();
  expect(screen.getByText(/93 messages non lus/)).toBeTruthy();
  expect(screen.queryByText(/Mue a repéré/)).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
});

it("reveals only the detected tasks after clicking the action in the sentence", () => {
  state.tasks = [
    {
      threadId: "thread-1",
      title: "Valider le devis",
      summary: "Le client attend votre validation avant demain.",
      senderName: "Maya",
      senderEmail: "maya@example.com",
      subject: "Devis",
    },
  ];
  render(<BriefWelcome freelancerName="" />);
  expect(screen.getByText(/Mue a repéré 1 action concrète/)).toBeTruthy();
  expect(screen.queryByText("Valider le devis")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Voir le brief/ }));
  expect(screen.getByText("Valider le devis")).toBeTruthy();
  expect(screen.getByRole("link").getAttribute("href")).toBe(
    "/channels-v4?conversation=thread-1",
  );
});
