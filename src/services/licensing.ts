import { productConfig } from "../config/productConfig";
import { supabase } from "../lib/supabase";

const LICENSE_STORAGE_KEY = "chops:license-key";
const INSTALL_STORAGE_KEY = "chops:install-id";
const LICENSE_STATE_KEY = "chops:license-state";

export type LicenseStatus = "active" | "revoked" | "expired" | "suspended";

export interface LicenseActivationResult {
  activationId: string;
  alreadyActivated: boolean;
  token: null;
  license: {
    product: string;
    productName: string;
    status: LicenseStatus;
    maxActivations: number;
    activatedCount: number;
  };
}

interface ActivationResponse extends Partial<LicenseActivationResult> {
  success?: boolean;
  message?: string;
  code?: string;
  details?: unknown;
}

export interface StoredLicenseState {
  activationId: string;
  product: string;
  productName: string;
  status: LicenseStatus;
  maxActivations: number;
  activatedCount: number;
  validatedAt: string;
}

function makeInstallId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `chops-install-${random}`;
}

export function getInstallId(): string {
  let installId = localStorage.getItem(INSTALL_STORAGE_KEY);

  if (!installId) {
    installId = makeInstallId();
    localStorage.setItem(INSTALL_STORAGE_KEY, installId);
  }

  return installId;
}

export function getStoredLicenseKey(): string {
  return localStorage.getItem(LICENSE_STORAGE_KEY) ?? "";
}

export function getStoredLicenseState(): StoredLicenseState | null {
  const raw = localStorage.getItem(LICENSE_STATE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredLicenseState;
  } catch {
    localStorage.removeItem(LICENSE_STATE_KEY);
    return null;
  }
}

export function clearLicense(): void {
  localStorage.removeItem(LICENSE_STORAGE_KEY);
  localStorage.removeItem(LICENSE_STATE_KEY);
}

export async function activateLicense(
  licenseKey: string,
): Promise<StoredLicenseState> {
  const normalizedKey = licenseKey.trim().toUpperCase();

  if (!normalizedKey) {
    throw new Error("Enter a ChangeOps license key.");
  }

  const { data, error } = await supabase.functions.invoke<ActivationResponse>(
    "activate-license",
    {
      body: {
        product: productConfig.slug,
        license: normalizedKey,
        machineHash: getInstallId(),
        version: productConfig.version,
      },
    },
  );

  if (error) {
    let message = error.message || "The license could not be validated.";

    const context = (error as { context?: Response }).context;

    if (context instanceof Response) {
      try {
        const body = (await context.clone().json()) as ActivationResponse;

        if (body.message) {
          message = body.message;
        }
      } catch {
        // Supabase already supplied a useful transport error message.
      }
    }

    throw new Error(message);
  }

  if (!data || data.success === false || !data.activationId || !data.license) {
    throw new Error(
      data?.message || "The licensing service returned an invalid response.",
    );
  }

  if (data.license.product.toUpperCase() !== productConfig.slug.toUpperCase()) {
    throw new Error("This license is not entitled for OneTime: ChangeOps.");
  }

  const state: StoredLicenseState = {
    activationId: data.activationId,
    product: data.license.product,
    productName: data.license.productName,
    status: data.license.status,
    maxActivations: data.license.maxActivations,
    activatedCount: data.license.activatedCount,
    validatedAt: new Date().toISOString(),
  };

  localStorage.setItem(LICENSE_STORAGE_KEY, normalizedKey);
  localStorage.setItem(LICENSE_STATE_KEY, JSON.stringify(state));

  return state;
}

export async function revalidateStoredLicense(): Promise<StoredLicenseState | null> {
  const key = getStoredLicenseKey();

  if (!key) {
    return null;
  }

  try {
    return await activateLicense(key);
  } catch (error) {
    clearLicense();
    throw error;
  }
}
