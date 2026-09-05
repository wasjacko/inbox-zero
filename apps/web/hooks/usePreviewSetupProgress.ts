"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "freescale-preview-setup-v4";
const CHANGE_EVENT = "freescale-preview-setup-change";

export type AssistantTone = "direct" | "cordial" | "professionnel";
export type AssistantResponseLength = "courte" | "equilibree" | "detaillee";
export type NewsletterDecision = "keep" | "unsubscribe";
export type TaskDetectionRule = "request" | "commitment" | "deadline";

export type PreviewSetupState = {
  steps: boolean[];
  assistant: {
    name: string;
    tone: AssistantTone;
    responseLength: AssistantResponseLength;
    autoSuggest: boolean;
    canCreateTasks: boolean;
    canLearnFromMessages: boolean;
  };
  newsletters: Record<string, NewsletterDecision>;
  channels: string[];
  taskAutomation: {
    enabled: boolean;
    requireApproval: boolean;
    rules: TaskDetectionRule[];
  };
};

const DEFAULT_STATE: PreviewSetupState = {
  steps: [false, false, false, false],
  assistant: {
    name: "Mue",
    tone: "professionnel",
    responseLength: "equilibree",
    autoSuggest: true,
    canCreateTasks: false,
    canLearnFromMessages: true,
  },
  newsletters: {},
  channels: [],
  taskAutomation: {
    enabled: false,
    requireApproval: true,
    rules: ["request", "commitment", "deadline"],
  },
};

function freshDefaultState(): PreviewSetupState {
  return {
    ...DEFAULT_STATE,
    steps: [...DEFAULT_STATE.steps],
    assistant: { ...DEFAULT_STATE.assistant },
    newsletters: {},
    channels: [],
    taskAutomation: {
      ...DEFAULT_STATE.taskAutomation,
      rules: [...DEFAULT_STATE.taskAutomation.rules],
    },
  };
}

function readState(): PreviewSetupState {
  if (typeof window === "undefined") return freshDefaultState();

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<PreviewSetupState> | null;

    if (!saved || !Array.isArray(saved.steps) || saved.steps.length !== 4) {
      return freshDefaultState();
    }

    return {
      steps: saved.steps.map(Boolean),
      assistant: {
        name: saved.assistant?.name || DEFAULT_STATE.assistant.name,
        tone: saved.assistant?.tone || DEFAULT_STATE.assistant.tone,
        responseLength:
          saved.assistant?.responseLength ||
          DEFAULT_STATE.assistant.responseLength,
        autoSuggest:
          saved.assistant?.autoSuggest ?? DEFAULT_STATE.assistant.autoSuggest,
        canCreateTasks:
          saved.assistant?.canCreateTasks ??
          DEFAULT_STATE.assistant.canCreateTasks,
        canLearnFromMessages:
          saved.assistant?.canLearnFromMessages ??
          DEFAULT_STATE.assistant.canLearnFromMessages,
      },
      newsletters: saved.newsletters ?? {},
      channels: Array.isArray(saved.channels) ? saved.channels : [],
      taskAutomation: {
        enabled:
          saved.taskAutomation?.enabled ?? DEFAULT_STATE.taskAutomation.enabled,
        requireApproval:
          saved.taskAutomation?.requireApproval ??
          DEFAULT_STATE.taskAutomation.requireApproval,
        rules: Array.isArray(saved.taskAutomation?.rules)
          ? saved.taskAutomation.rules
          : [...DEFAULT_STATE.taskAutomation.rules],
      },
    };
  } catch {
    return freshDefaultState();
  }
}

export function syncChannelSetupStep(steps: boolean[], channels: string[]) {
  return steps.map((value, index) =>
    index === 0 ? channels.length > 0 : value,
  );
}

export function usePreviewSetupProgress() {
  const [state, setState] = useState<PreviewSetupState>(freshDefaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setState(readState());
    sync();
    setHydrated(true);
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((next: PreviewSetupState) => {
    setState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const update = useCallback(
    (updater: (current: PreviewSetupState) => PreviewSetupState) => {
      save(updater(readState()));
    },
    [save],
  );

  const saveAssistant = useCallback(
    (assistant: PreviewSetupState["assistant"]) => {
      update((current) => ({
        ...current,
        assistant,
        steps: current.steps.map((value, index) =>
          index === 2 ? true : value,
        ),
      }));
    },
    [update],
  );

  const saveNewsletters = useCallback(
    (newsletters: PreviewSetupState["newsletters"]) => {
      update((current) => ({
        ...current,
        newsletters,
        steps: current.steps.map((value, index) =>
          index === 1 ? true : value,
        ),
      }));
    },
    [update],
  );

  const saveChannels = useCallback(
    (channels: string[]) => {
      update((current) => ({
        ...current,
        channels,
        steps: syncChannelSetupStep(current.steps, channels),
      }));
    },
    [update],
  );

  const saveTaskAutomation = useCallback(
    (taskAutomation: PreviewSetupState["taskAutomation"]) => {
      update((current) => ({
        ...current,
        taskAutomation,
        assistant: {
          ...current.assistant,
          canCreateTasks: taskAutomation.enabled,
        },
        steps: current.steps.map((value, index) =>
          index === 3 ? true : value,
        ),
      }));
    },
    [update],
  );

  const completeStep = useCallback(
    (stepIndex: number) => {
      update((current) => ({
        ...current,
        steps: current.steps.map((value, index) =>
          index === stepIndex ? true : value,
        ),
      }));
    },
    [update],
  );

  const resetSetup = useCallback(() => save(freshDefaultState()), [save]);

  const completed = state.steps.filter(Boolean).length;

  return {
    ...state,
    hydrated,
    completed,
    total: DEFAULT_STATE.steps.length,
    isComplete: completed === DEFAULT_STATE.steps.length,
    saveAssistant,
    saveNewsletters,
    saveChannels,
    saveTaskAutomation,
    completeStep,
    resetSetup,
  };
}
