function requiredEnv(name: string, value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${name} is required.`);
  }

  return normalized;
}

export const env = {
  // Shared OneTime Labs Supabase project.
  // Used by ChangeOps application data, authentication, platform data,
  // and licensing.
  supabaseUrl: requiredEnv(
    "VITE_SUPABASE_URL",
    import.meta.env.VITE_SUPABASE_URL,
  ),

  supabasePublishableKey: requiredEnv(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ),

  demoMode: import.meta.env.VITE_DEMO_MODE === "true",
  authRequired: import.meta.env.VITE_AUTH_REQUIRED === "true",
};
