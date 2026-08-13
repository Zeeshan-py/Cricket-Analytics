export class DataAccessNotConfiguredError extends Error {
  constructor(message = "Supabase data access is not configured for this environment.") {
    super(message);
    this.name = "DataAccessNotConfiguredError";
  }
}

export function isMissingSupabaseConfig(error: unknown) {
  return error instanceof Error && error.message.startsWith("Missing required environment variable:");
}
