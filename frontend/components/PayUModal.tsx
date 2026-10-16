"use client";

import React, { useEffect, useState, useRef } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/config";
import { Loader2, X, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    bolt?: {
      launch: (
        payload: Record<string, any>,
        handlers: {
          responseHandler: (response: any) => void;
          catchException: (error: any) => void;
        },
      ) => void;
    };
  }
}

export interface PayUModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  billingCycle?: "monthly" | "annual" | "sixmonth";
  priceAmount?: number;
  onSuccess?: () => void;
}

export const PayUModal: React.FC<PayUModalProps> = ({
  isOpen,
  onClose,
  planName = "6-Month Akam Digital Pass",
  billingCycle = "sixmonth",
  priceAmount = 1,
  onSuccess,
}) => {
  const [status, setStatus] = useState<"launching" | "open" | "error">("launching");
  const [errorMsg, setErrorMsg] = useState("");
  const launchedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      launchedRef.current = false;
      setStatus("launching");
      setErrorMsg("");
      return;
    }

    if (launchedRef.current) return;
    launchedRef.current = true;

    const launchPayUModal = async () => {
      setStatus("launching");
      setErrorMsg("");

      try {
        // Ensure PayU Bolt script is loaded
        if (typeof window !== "undefined") {
          await new Promise<void>((resolve, reject) => {
            const isProdPayU = process.env.NEXT_PUBLIC_PAYU_ENV === "PRODUCTION";
            const targetSrc = isProdPayU
              ? "https://jssdk.payu.in/bolt/bolt.min.js"
              : "https://jssdk-uat.payu.in/bolt/bolt.min.js";

            const existingScript = document.querySelector('script[src*="bolt.min.js"]') as HTMLScriptElement | null;
            if (existingScript && window.bolt) {
              if (existingScript.src.includes(isProdPayU ? "jssdk.payu.in" : "jssdk-uat.payu.in")) {
                resolve();
                return;
              }
              // Remove wrong environment script from layout or previous load
              existingScript.remove();
              delete (window as any).bolt;
            }

            const script = document.createElement("script");
            script.src = targetSrc;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load PayU Checkout SDK"));
            document.head.appendChild(script);
          });
        }

        // Fetch secure PayU Bolt payload & SHA-512 Hash from backend
        const res = await apiFetch(`${API_BASE_URL}/subscription/payu/bolt-payload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planType: "SIX_MONTH",
            amount: priceAmount,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to initialize PayU payment session");
        }

        const boltPayload = await res.json();

        if (!window.bolt || typeof window.bolt.launch !== "function") {
          throw new Error("PayU Bolt gateway is not available");
        }

        setStatus("open");

        // Directly launch the official PayU checkout modal popup on the site
        window.bolt.launch(
          {
            key: boltPayload.key,
            txnid: boltPayload.txnid,
            hash: boltPayload.hash,
            amount: boltPayload.amount,
            firstname: boltPayload.firstname,
            email: boltPayload.email,
            phone: boltPayload.phone,
            productinfo: boltPayload.productinfo,
            surl: boltPayload.surl,
            furl: boltPayload.furl,
            mode: "dropout",
          },
          {
            responseHandler: async function (BOLT: any) {
              console.log("[PayU Bolt Response]:", BOLT);

              const response = BOLT?.response;
              if (response && response.txnStatus === "SUCCESS") {
                const finalTxn = response.txnid || boltPayload.txnid;

                try {
                  const activateRes = await apiFetch(`${API_BASE_URL}/subscription/activate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ txnId: finalTxn }),
                  });

                  if (activateRes.ok) {
                    const data = await activateRes.json();
                    const rawUser = localStorage.getItem("akam_user");
                    if (rawUser) {
                      const userObj = JSON.parse(rawUser);
                      localStorage.setItem(
                        "akam_user",
                        JSON.stringify({
                          ...userObj,
                          subscriptionStatus: "ACTIVE",
                          subscriptionEndDate: data.endDate ?? null,
                          isStudent: false,
                        }),
                      );
                    }
                  }
                } catch (err) {
                  console.error("Failed to sync subscription status:", err);
                }

                if (typeof window !== "undefined") {
                  localStorage.setItem("akam_masika_pass", "true");
                  localStorage.setItem("akam_pass_type", planName);
                  localStorage.setItem("akam_pass_cycle", billingCycle);
                  localStorage.setItem("akam_pass_txn", finalTxn);
                  localStorage.setItem("akam_pass_date", new Date().toISOString());
                  window.dispatchEvent(new Event("akam_user_updated"));
                }

                if (onSuccess) onSuccess();
                onClose();
              } else if (response && response.txnStatus === "CANCEL") {
                onClose();
              } else {
                setErrorMsg(response?.error_Message || "Payment was not completed.");
                setStatus("error");
              }
            },
            catchException: function (err: any) {
              console.error("[PayU Bolt Exception]:", err);
              setErrorMsg(err?.message || "PayU Checkout modal was closed or encountered an error.");
              setStatus("error");
            },
          },
        );
      } catch (err: any) {
        console.error("[PayU] Failed to launch PayU modal:", err);
        setErrorMsg(err.message || "Failed to open PayU gateway modal");
        setStatus("error");
      }
    };

    launchPayUModal();
  }, [isOpen, priceAmount, planName, billingCycle, onSuccess, onClose]);

  if (!isOpen) return null;

  // If the PayU modal is launching, show a minimal loading backdrop
  if (status === "launching" || status === "open") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-3">
          <Loader2 className="w-9 h-9 text-[#22B573] animate-spin" />
          <div>
            <h4 className="text-sm font-bold text-gray-900">Opening PayU Payment Gateway...</h4>
            <p className="text-xs text-gray-500 mt-1">Connecting to official PayU checkout modal</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 pt-2 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Error fallback card if browser blocks popup/iframe or network fails
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="bg-[#75c043] text-[#002842] px-2 py-0.5 rounded font-black text-xs">PayU</span>
            <span className="text-sm font-bold text-gray-900">PayU Payment</span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center py-4 space-y-2">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Payment Notice</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMsg || "Payment cancelled or could not be initiated."}</p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              launchedRef.current = false;
              setStatus("launching");
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#22B573] hover:bg-[#1fa769] text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Retry Opening PayU
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayUModal;
