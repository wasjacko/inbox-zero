import type {
  MailCount,
  MailFolder,
  MailLabel,
  MailThread,
} from "@/app/(app)/[emailAccountId]/mail/types";

export const MOCK_CURRENT_USER = {
  name: "Alex Morgan",
  email: "alex@northstar.studio",
};

export const MOCK_LABELS: MailLabel[] = [
  { id: "priority", name: "Priority", color: "#F59E0B" },
  { id: "customers", name: "Customers", color: "#2563EB" },
  { id: "product", name: "Product", color: "#8B5CF6" },
  { id: "finance", name: "Finance", color: "#10B981" },
];

export const MOCK_FOLDERS: MailFolder[] = [
  { id: "starred", displayName: "Starred", depth: 0 },
  { id: "follow-up", displayName: "Follow up", depth: 0 },
];

export const MOCK_THREADS: MailThread[] = [
  {
    id: "thread-acme-renewal",
    subject: "Acme renewal — final scope",
    snippet:
      "The revised scope looks good. Could you send the final timeline before our call tomorrow?",
    participant: { name: "Maya Chen", email: "maya@acme.co" },
    updatedAt: "2026-08-12T09:42:00.000Z",
    mailbox: "inbox",
    category: "customers",
    labelIds: ["priority", "customers"],
    unread: true,
    messages: [
      {
        id: "message-acme-1",
        sender: { name: "Maya Chen", email: "maya@acme.co" },
        recipients: [MOCK_CURRENT_USER],
        sentAt: "2026-08-11T15:18:00.000Z",
        body: "Hi Alex,\n\nThanks for walking us through the new proposal. The revised scope looks good on our side. I only have one request: could you send the final timeline before our call tomorrow?\n\nThat will let me align the launch date with our operations team.\n\nBest,\nMaya",
      },
      {
        id: "message-acme-2",
        sender: MOCK_CURRENT_USER,
        recipients: [{ name: "Maya Chen", email: "maya@acme.co" }],
        sentAt: "2026-08-12T08:55:00.000Z",
        body: "Hi Maya,\n\nAbsolutely. I’m consolidating the milestones this morning and will send the final timeline before noon.\n\nAlex",
        isFromCurrentUser: true,
      },
      {
        id: "message-acme-3",
        sender: { name: "Maya Chen", email: "maya@acme.co" },
        recipients: [MOCK_CURRENT_USER],
        sentAt: "2026-08-12T09:42:00.000Z",
        body: "Perfect, thank you. I’ll circulate it internally before the call.",
      },
    ],
  },
  {
    id: "thread-onboarding-feedback",
    subject: "Feedback from our first week",
    snippet:
      "The team adopted the workspace quickly. We have two small onboarding questions.",
    participant: { name: "Jon Bell", email: "jon@papertrail.io" },
    updatedAt: "2026-08-12T08:16:00.000Z",
    mailbox: "inbox",
    category: "customers",
    labelIds: ["customers", "product"],
    unread: true,
    messages: [
      {
        id: "message-feedback-1",
        sender: { name: "Jon Bell", email: "jon@papertrail.io" },
        recipients: [MOCK_CURRENT_USER],
        sentAt: "2026-08-12T08:16:00.000Z",
        body: "Hi Alex,\n\nThe team adopted the workspace quickly and the shared inbox is already saving us time. We have two small onboarding questions around permissions and saved views.\n\nCould we cover them in a short call this week?\n\nJon",
      },
    ],
  },
  {
    id: "thread-investor-update",
    subject: "August investor update",
    snippet:
      "A concise update on growth, product delivery, and the next set of milestones.",
    participant: { name: "Alex Morgan", email: "alex@northstar.studio" },
    updatedAt: "2026-08-11T17:35:00.000Z",
    mailbox: "draft",
    category: "updates",
    labelIds: ["finance"],
    unread: false,
    draft: true,
    messages: [
      {
        id: "message-investor-1",
        sender: MOCK_CURRENT_USER,
        recipients: [
          { name: "Northstar investors", email: "investors@northstar.studio" },
        ],
        sentAt: "2026-08-11T17:35:00.000Z",
        body: "Hello everyone,\n\nHere is a concise update on growth, product delivery, and the milestones we are targeting for the rest of August.\n\n[Draft in progress]",
        isFromCurrentUser: true,
      },
    ],
  },
  {
    id: "thread-invoice-july",
    subject: "Invoice #1048 paid",
    snippet:
      "Your July invoice has been paid successfully. No action is required.",
    participant: { name: "Stripe", email: "receipts@stripe.com" },
    updatedAt: "2026-08-11T13:08:00.000Z",
    mailbox: "inbox",
    category: "updates",
    labelIds: ["finance"],
    unread: false,
    messages: [
      {
        id: "message-invoice-1",
        sender: { name: "Stripe", email: "receipts@stripe.com" },
        recipients: [MOCK_CURRENT_USER],
        sentAt: "2026-08-11T13:08:00.000Z",
        body: "Your payment for invoice #1048 was successful.\n\nAmount: $2,480.00\nPayment method: Visa ending in 4242\n\nNo action is required.",
      },
    ],
  },
  {
    id: "thread-product-review",
    subject: "Notes on the new customer profile",
    snippet:
      "The hierarchy is much clearer now. I left three comments on the prototype.",
    participant: { name: "Sofia Reyes", email: "sofia@northstar.studio" },
    updatedAt: "2026-08-11T10:24:00.000Z",
    mailbox: "inbox",
    category: "personal",
    labelIds: ["product"],
    unread: false,
    messages: [
      {
        id: "message-review-1",
        sender: { name: "Sofia Reyes", email: "sofia@northstar.studio" },
        recipients: [MOCK_CURRENT_USER],
        sentAt: "2026-08-11T10:24:00.000Z",
        body: "The hierarchy is much clearer now. I left three comments on the prototype, mostly around the empty state and the transition between tabs.\n\nNothing blocking — happy to review again after the next pass.",
      },
    ],
  },
  {
    id: "thread-demo-followup",
    subject: "Re: Enterprise demo",
    snippet:
      "Thanks for the thoughtful demo. Procurement would like the security overview next.",
    participant: { name: "Noah Williams", email: "noah@vertexlabs.com" },
    updatedAt: "2026-08-10T16:52:00.000Z",
    mailbox: "sent",
    category: "customers",
    labelIds: ["priority", "customers"],
    unread: false,
    messages: [
      {
        id: "message-demo-1",
        sender: { name: "Noah Williams", email: "noah@vertexlabs.com" },
        recipients: [MOCK_CURRENT_USER],
        sentAt: "2026-08-10T14:02:00.000Z",
        body: "Thanks for the thoughtful demo. The workflow is a strong fit for our support team. Procurement would like the security overview next.",
      },
      {
        id: "message-demo-2",
        sender: MOCK_CURRENT_USER,
        recipients: [{ name: "Noah Williams", email: "noah@vertexlabs.com" }],
        sentAt: "2026-08-10T16:52:00.000Z",
        body: "Thanks Noah. I’ve attached the security overview to our shared deal room and sent procurement access. Let me know if they need a live review.",
        isFromCurrentUser: true,
      },
    ],
  },
  {
    id: "thread-weekly-digest",
    subject: "The operating system for small teams",
    snippet:
      "Five practical ideas for reducing coordination overhead as your team grows.",
    participant: { name: "Dense Discovery", email: "hello@densediscovery.com" },
    updatedAt: "2026-08-09T07:40:00.000Z",
    mailbox: "archive",
    category: "promotions",
    labelIds: [],
    unread: false,
    messages: [
      {
        id: "message-digest-1",
        sender: { name: "Dense Discovery", email: "hello@densediscovery.com" },
        recipients: [MOCK_CURRENT_USER],
        sentAt: "2026-08-09T07:40:00.000Z",
        body: "This week: five practical ideas for reducing coordination overhead as your team grows, a field guide to calmer planning, and three tools worth trying.",
      },
    ],
  },
  {
    id: "thread-partnership",
    subject: "Partnership introduction",
    snippet:
      "I think our customer communities overlap in a useful way. Open to comparing notes?",
    participant: { name: "Priya Kapoor", email: "priya@commonroom.co" },
    updatedAt: "2026-08-08T14:12:00.000Z",
    mailbox: "inbox",
    category: "social",
    labelIds: [],
    unread: true,
    messages: [
      {
        id: "message-partnership-1",
        sender: { name: "Priya Kapoor", email: "priya@commonroom.co" },
        recipients: [MOCK_CURRENT_USER],
        sentAt: "2026-08-08T14:12:00.000Z",
        body: "Hi Alex,\n\nI’ve been following what Northstar is building. I think our customer communities overlap in a useful way, especially around support operations.\n\nWould you be open to comparing notes next week?\n\nPriya",
      },
    ],
  },
];

export function createMockCounts(
  threads: MailThread[],
  labels: MailLabel[] = MOCK_LABELS,
) {
  const ids = [
    "inbox",
    "draft",
    "sent",
    "archive",
    "personal",
    "social",
    "updates",
    "forums",
    "promotions",
    ...labels.map((label) => label.id),
    ...MOCK_FOLDERS.map((folder) => folder.id),
  ];

  return new Map<string, MailCount>(
    ids.map((id) => {
      const matching = threads.filter((thread) => {
        if (id === "starred") return thread.labelIds.includes("priority");
        if (id === "follow-up") {
          return thread.mailbox === "inbox" && thread.unread;
        }
        return (
          thread.mailbox === id ||
          thread.category === id ||
          thread.labelIds.includes(id)
        );
      });
      return [
        id,
        {
          id,
          total: matching.length,
          unread: matching.filter((thread) => thread.unread).length,
        },
      ];
    }),
  );
}
