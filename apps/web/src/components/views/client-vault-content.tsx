"use client";



import { VaultCatalogRepository } from "@/components/vault/vault-catalog-repository";
import { VaultFileUpload } from "@/components/vault/vault-file-upload";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faShield } from "@/lib/fontawesome-icons";

import type {

  VaultCatalogGroup,

  VaultCatalogResponse,

} from "@/lib/vault-catalog-types";

import type { VaultUploadResult } from "@/lib/vault-upload-types";

import { vaultObjectsPath } from "@/lib/vault-api-context";

import { useAppProgress } from "@/lib/app-progress";

import { useToast } from "@/lib/toast";
import { withImageCacheBuster } from "@/lib/platform-images-client";
import { useCallback, useEffect, useState } from "react";

type ClientVaultContentProps = {
  organization: string;
  organizationLogoPath?: string | null;
  organizationLogoUpdatedAt?: string | null;
  initialGroups: VaultCatalogGroup[];
  initialHiddenGroups?: VaultCatalogGroup[];
  initialCount: number;
  initialHiddenCount?: number;
  initialVisibleCount?: number;
  initialClassificationReady?: boolean;
};



type CatalogStatus = "idle" | "loading" | "ready" | "error";



const integrations = [

  { name: "QuickBooks", connected: true },

  { name: "Pipedrive", connected: true },

  { name: "Quotient", connected: true },

  { name: "AnswerConnect", connected: true },

  { name: "Salesforce", connected: false },

  { name: "Google Sheets", connected: false },

];



function sleep(ms: number) {

  return new Promise((resolve) => setTimeout(resolve, ms));

}



export function ClientVaultContent({
  organization,
  organizationLogoPath = null,
  organizationLogoUpdatedAt = null,
  initialGroups,
  initialHiddenGroups = [],
  initialCount,
  initialHiddenCount = 0,
  initialVisibleCount,
  initialClassificationReady = true,
}: ClientVaultContentProps) {

  const [groups, setGroups] = useState(initialGroups);
  const [hiddenGroups, setHiddenGroups] = useState(initialHiddenGroups);
  const [count, setCount] = useState(initialCount);
  const [hiddenCount, setHiddenCount] = useState(initialHiddenCount);
  const [visibleCount, setVisibleCount] = useState(
    initialVisibleCount ?? initialCount - initialHiddenCount,
  );
  const [classificationReady, setClassificationReady] = useState(
    initialClassificationReady,
  );

  const [pendingS3Key, setPendingS3Key] = useState<string | null>(null);

  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>(

    initialCount > 0 ? "ready" : "loading",

  );

  const [catalogError, setCatalogError] = useState<string | null>(null);

  const { startProgress, stopProgress } = useAppProgress();

  const { pushToast } = useToast();



  useEffect(() => {

    setGroups(initialGroups);
    setHiddenGroups(initialHiddenGroups);
    setCount(initialCount);
    setHiddenCount(initialHiddenCount);
    setVisibleCount(initialVisibleCount ?? initialCount - initialHiddenCount);
    setClassificationReady(initialClassificationReady);

    if (initialCount > 0) {

      setCatalogStatus("ready");

      setCatalogError(null);

    }

  }, [initialCount, initialGroups, initialHiddenCount, initialHiddenGroups, initialVisibleCount, initialClassificationReady]);



  const applyCatalog = useCallback((catalog: VaultCatalogResponse) => {

    setGroups(catalog.groups);
    setHiddenGroups(catalog.hiddenGroups);
    setCount(catalog.count);
    setHiddenCount(catalog.hiddenCount);
    setVisibleCount(catalog.visibleCount);
    setClassificationReady(catalog.classificationReady);

    setCatalogStatus("ready");

    setCatalogError(null);

  }, []);



  const fetchCatalog = useCallback(async (): Promise<VaultCatalogResponse> => {

    const res = await fetch(vaultObjectsPath({ scope: "client" }), {

      cache: "no-store",

    });

    const body = (await res.json().catch(() => ({}))) as

      | VaultCatalogResponse

      | { error?: string };



    if (!res.ok) {

      throw new Error(

        "error" in body && body.error

          ? body.error

          : `Catalog refresh failed (${res.status})`,

      );

    }



    return body as VaultCatalogResponse;

  }, []);



  const refreshCatalog = useCallback(async () => {

    setCatalogStatus("loading");

    setCatalogError(null);

    startProgress();



    try {

      const catalog = await fetchCatalog();

      applyCatalog(catalog);

    } catch (error) {

      setCatalogStatus("error");

      setCatalogError(

        error instanceof Error ? error.message : "Could not load Vault catalog",

      );

    } finally {

      stopProgress();

    }

  }, [applyCatalog, fetchCatalog, startProgress, stopProgress]);



  useEffect(() => {

    if (initialCount > 0) {

      return;

    }



    void refreshCatalog();

  }, [initialCount, refreshCatalog]);



  const handleUploaded = useCallback(

    async (result: VaultUploadResult, _filename: string) => {

      setPendingS3Key(result.s3_key);

      startProgress();



      try {

        for (let attempt = 0; attempt < 20; attempt += 1) {

          await sleep(attempt === 0 ? 1500 : 3000);

          const catalog = await fetchCatalog();

          applyCatalog(catalog);



          if (catalog.objects.some((object) => object.s3_key === result.s3_key)) {

            pushToast("File added to your Vault catalog", "success");

            return;

          }

        }



        pushToast(

          "Upload complete — catalog may take a moment to update. Refresh if needed.",

          "info",

        );

      } catch {

        pushToast(

          "Upload succeeded but catalog refresh failed. Try reloading the page.",

          "warning",

        );

      } finally {

        setPendingS3Key(null);

        stopProgress();

      }

    },

    [applyCatalog, fetchCatalog, pushToast, startProgress, stopProgress],

  );



  const organizationLogoSrc = withImageCacheBuster(
    organizationLogoPath,
    organizationLogoUpdatedAt,
  );

  return (

    <div className="container-fluid py-4">
      <div className="vault-header mb-4">
        <div className="vault-header-title">
          <span className="vault-header-icon" aria-hidden>
            <FontAwesomeIcon icon={faShield} />
          </span>
          <span className="h1 vault-header-text mb-0">The Vault</span>
        </div>
        <div className="vault-header-logo">
          {organizationLogoSrc ? (
            <span className="vault-header-org-avatar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={organizationLogoSrc} alt="" />
            </span>
          ) : null}
          <span className="vault-header-org-name">{organization}</span>
        </div>
      </div>

      <div className="row g-4">

        <div className="col-lg-4">

          <div className="app-card">

            <h2 className="h5 mb-1">Add data source</h2>

            <p className="text-body-secondary small mb-4">

              Upload files to your Vault

            </p>



            <VaultFileUpload

              onUploaded={(result, filename) => void handleUploaded(result, filename)}

            />

          </div>



          <div className="app-card mt-4">

            <h2 className="h5 mb-1">Connect a system</h2>

            <p className="text-body-secondary small mb-4">

              Link external tools to sync data automatically

            </p>



            <div className="vault-placeholder-block mb-0">

              <div className="vault-placeholder-label">Coming soon</div>

              <div className="row g-2">

                {integrations.map((item) => (

                  <div key={item.name} className="col-6">

                    <div className="integration-tile integration-tile-placeholder">

                      <span>{item.name}</span>

                      <span className="small text-body-secondary">Soon</span>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>



        <div className="col-lg-8">

          {catalogStatus === "error" ? (

            <div className="app-card">

              <h2 className="h5 mb-2">Data repository</h2>

              <p className="text-body-secondary small mb-3">

                We couldn&apos;t load your Vault catalog right now.

              </p>

              <div className="alert alert-warning py-2 small mb-3" role="alert">

                {catalogError ?? "Could not load Vault catalog."}

              </div>

              <button

                type="button"

                className="btn btn-sm btn-outline-primary"

                onClick={() => void refreshCatalog()}

              >

                Try again

              </button>

            </div>

          ) : (

            <VaultCatalogRepository
              groups={groups}
              hiddenGroups={hiddenGroups}
              count={count}
              visibleCount={visibleCount}
              hiddenCount={hiddenCount}
              classificationReady={classificationReady}
              pendingS3Key={pendingS3Key}
              loading={catalogStatus === "loading" && count === 0}
            />

          )}

        </div>

      </div>

    </div>

  );

}

