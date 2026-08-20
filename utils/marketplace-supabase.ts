import { createClient } from "@supabase/supabase-js";
import type { Database } from "./marketplace-database.types";

// Create a client specifically for the Marketplace database
export function createMarketplaceClient() {
  const marketplaceUrl = process.env.NEXT_PUBLIC_MARKETPLACE_SUPABASE_URL;
  const marketplaceKey = process.env.NEXT_PUBLIC_MARKETPLACE_SUPABASE_ANON_KEY;

  if (!marketplaceUrl || !marketplaceKey) {
    throw new Error("Missing Marketplace Supabase credentials");
  }

  return createClient<Database>(marketplaceUrl, marketplaceKey);
}
