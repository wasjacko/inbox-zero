export function demoChannelKey(userId: string | undefined, channel: string) {
  return userId ? `freescale-demo-v2:${userId}:${channel}` : null;
}

export function ownsConnectedDemo(
  key: string | null,
  snapshot: { key: string | null; connected: boolean },
) {
  return !!key && snapshot.key === key && snapshot.connected;
}
