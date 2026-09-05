type GoogleLoginHintUser = {
  email: string;
  accounts: Array<{ provider: string }>;
} | null;

export function getGoogleOnboardingLoginHint({
  preferSignedInGoogleAccount,
  user,
}: {
  preferSignedInGoogleAccount: boolean;
  user: GoogleLoginHintUser;
}) {
  if (!preferSignedInGoogleAccount || !user?.email) return;

  const signedUpOnlyWithGoogle = user.accounts.some(
    (account) => account.provider === "google",
  );

  return signedUpOnlyWithGoogle ? user.email : undefined;
}
