export const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",

  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.settings.basic",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/contacts.other.readonly",
];

const GMAIL_MAILBOX_SCOPE = "https://www.googleapis.com/auth/gmail.modify";

export function hasGmailMailboxScope(scope: string | null | undefined) {
  if (!scope) return false;

  return new Set(scope.split(/[\s,]+/).filter(Boolean)).has(
    GMAIL_MAILBOX_SCOPE,
  );
}

export function isGoogleIdentityOnlyScope(scope: string | null | undefined) {
  if (!scope) return false;

  const grantedScopes = new Set(scope.split(/[\s,]+/).filter(Boolean));
  return (
    grantedScopes.has("openid") &&
    grantedScopes.has("email") &&
    grantedScopes.has("profile") &&
    !hasGmailMailboxScope(scope)
  );
}

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events", // For writing/creating events in the future
  "https://www.googleapis.com/auth/calendar.freebusy", // For checking free/busy status
  // "https://www.googleapis.com/auth/calendar.settings.readonly", // For reading calendar settings
  // "https://www.googleapis.com/auth/calendar.settings", // For modifying calendar settings
  // "https://www.googleapis.com/auth/calendar.calendars.readonly", // For reading calendar metadata
  // "https://www.googleapis.com/auth/calendar.calendars", // For creating/managing calendars
];
