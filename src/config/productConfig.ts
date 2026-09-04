import type { ProductConfig } from "./types";

export const productConfig: ProductConfig = {
  name: "OneTime: ChangeOps",
  shortName: "CHOPS",
  slug: "CHOPS",
  licensePrefix: "OTL-CHOPS",
  version: import.meta.env.VITE_APP_VERSION?.trim() || "1.0.0",
};
