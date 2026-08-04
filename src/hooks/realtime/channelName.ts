/**
 * Generates a globally-unique realtime channel name.
 *
 * IMPORTANT: `supabase.channel(name)` REUSES an existing channel if one with
 * the same topic is still present in the client's registry. `removeChannel()`
 * is async, so a channel can linger in the registry after its owner unmounts.
 * A monotonically increasing per-module counter is NOT enough: Fast Refresh /
 * HMR reloads the hook module (resetting the counter) while the supabase client
 * singleton — and its channel registry — survives, so a regenerated name
 * collides with the stale channel and `.on()` throws
 * "cannot add postgres_changes callbacks … after subscribe()".
 *
 * Including a timestamp + random suffix guarantees every channel name is
 * globally unique for the lifetime of the process, so `supabase.channel()`
 * always returns a fresh, unsubscribed channel.
 */
export function uniqueChannelName(base: string): string {
  return `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
