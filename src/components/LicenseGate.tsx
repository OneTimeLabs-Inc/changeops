import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { env } from "../config/env";
import { productConfig } from "../config/productConfig";
import {
  activateLicense,
  getStoredLicenseKey,
  revalidateStoredLicense,
  type StoredLicenseState,
} from "../services/licensing";

interface Props {
  children: ReactNode;
  onLicenseState: (state: StoredLicenseState | null) => void;
}

export default function LicenseGate({ children, onLicenseState }: Props) {
  const [status, setStatus] = useState<"checking" | "locked" | "ready">("checking");
  const [licenseKey, setLicenseKey] = useState(getStoredLicenseKey());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;

    revalidateStoredLicense()
      .then((state) => {
        if (!alive) return;
        onLicenseState(state);
        setStatus(state ? "ready" : "locked");
      })
      .catch((caught: unknown) => {
        if (!alive) return;
        setError(caught instanceof Error ? caught.message : "License validation failed.");
        onLicenseState(null);
        setStatus("locked");
      });

    return () => {
      alive = false;
    };
  }, [onLicenseState]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const state = await activateLicense(licenseKey);
      onLicenseState(state);
      setStatus("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "License activation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "ready") return <>{children}</>;

  if (status === "checking") {
    return (
      <main className="gate-page">
        <section className="gate-card gate-checking">
          <div className="gate-logo">CHOPS</div>
          <div className="spinner" />
          <h1>Validating ChangeOps</h1>
          <p>Checking this installation with OneTime Labs Licensing.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="gate-page">
      <section className="gate-card">
        <div className="gate-brand-row">
          <div className="gate-logo">CHOPS</div>
          <div>
            <span>ONETIME LABS</span>
            <strong>{productConfig.name}</strong>
          </div>
        </div>

        <div className="gate-copy">
          <ShieldCheck size={30} strokeWidth={1.6} />
          <h1>Activate ChangeOps</h1>
          <p>
            Enter the license issued for this installation. ChangeOps validates against the shared OneTime Labs licensing service.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="gate-form">
          <label htmlFor="license-key">License key</label>
          <div className="gate-input-wrap">
            <KeyRound size={16} />
            <input
              id="license-key"
              value={licenseKey}
              onChange={(event) => setLicenseKey(event.target.value)}
              placeholder="OTL-CHOPS-..."
              autoComplete="off"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Validating..." : "Activate ChangeOps"}
          </button>
        </form>

        {env.demoMode && (
          <button
            type="button"
            className="demo-bypass"
            onClick={() => {
              onLicenseState(null);
              setStatus("ready");
            }}
          >
            Open local prototype without activation
          </button>
        )}

        <div className="gate-meta">
          <span>{productConfig.slug}</span>
          <span>{productConfig.licensePrefix}</span>
          <span>v{productConfig.version}</span>
        </div>
      </section>
    </main>
  );
}
