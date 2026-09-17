"use client";

import React, { useState } from "react";
import {
  X,
  CreditCard,
  Building2,
  Smartphone,
  Lock,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export interface PayUModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  billingCycle?: "monthly" | "annual";
  priceAmount?: number;
  onSuccess?: () => void;
}

export const PayUModal: React.FC<PayUModalProps> = ({
  isOpen,
  onClose,
  planName = "Masika Pass",
  billingCycle = "monthly",
  priceAmount = 149,
  onSuccess,
}) => {
  const [paymentStep, setPaymentStep] = useState<"checkout" | "processing" | "success" | "error">("checkout");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");

  // Form Inputs
  const [upiId, setUpiId] = useState("demo.reader@upi");
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");
  const [cardHolder, setCardHolder] = useState("Akam Reader");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [txnId, setTxnId] = useState("");

  if (!isOpen) return null;

  const handleSimulatePayment = (successOutcome: boolean = true) => {
    setPaymentStep("processing");

    setTimeout(() => {
      if (successOutcome) {
        const generatedTxn = `TXN-PAYU-${Math.floor(1000000 + Math.random() * 9000000)}`;
        setTxnId(generatedTxn);
        if (typeof window !== "undefined") {
          localStorage.setItem("akam_masika_pass", "true");
          localStorage.setItem("akam_pass_type", planName);
          localStorage.setItem("akam_pass_cycle", billingCycle);
          localStorage.setItem("akam_pass_txn", generatedTxn);
          localStorage.setItem("akam_pass_date", new Date().toISOString());
        }
        setPaymentStep("success");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setPaymentStep("error");
      }
    }, 1500);
  };

  const handleResetModal = () => {
    setPaymentStep("checkout");
    onClose();
  };

  const formattedAmount = billingCycle === "monthly" ? priceAmount : priceAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl font-poppins overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col">
        {/* PayU Branded Top Header */}
        <div className="bg-[#002842] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="bg-[#75c043] text-[#002842] px-2 py-1 rounded-md font-black text-xs tracking-tighter">
              PayU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">PayU Biz / Payment Gateway</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/40">
                  SANDBOX
                </span>
              </div>
              <p className="text-[11px] text-gray-300">Merchant: AKAM DIGITAL PUBLICATIONS</p>
            </div>
          </div>
          <button
            onClick={handleResetModal}
            className="p-1.5 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {paymentStep === "checkout" && (
            <>
              {/* Order Summary Pill */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Plan Selected</span>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900">
                    {planName} ({billingCycle === "monthly" ? "Monthly" : "Annual Billing"})
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">All-access reading & PDF downloads</p>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#22B573]">₹{formattedAmount}</span>
                  <span className="block text-[10px] text-gray-400">Incl. all taxes</span>
                </div>
              </div>

              {/* Sandbox Quick Fill Alert */}
              <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Test sandbox credentials pre-loaded for demonstration.</span>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === "upi"
                        ? "border-[#22B573] bg-emerald-50/40 text-gray-950 ring-1 ring-[#22B573]"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-[#22B573]" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === "card"
                        ? "border-[#22B573] bg-emerald-50/40 text-gray-950 ring-1 ring-[#22B573]"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-[#22B573]" />
                    <span>Cards</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("netbanking")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === "netbanking"
                        ? "border-[#22B573] bg-emerald-50/40 text-gray-950 ring-1 ring-[#22B573]"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-[#22B573]" />
                    <span>Net Banking</span>
                  </button>
                </div>
              </div>

              {/* Payment Method Details Form */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/40 space-y-3">
                {paymentMethod === "upi" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Virtual Payment Address (UPI ID)
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:border-[#22B573] focus:ring-1 focus:ring-[#22B573]"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500">
                      <span className="font-semibold text-gray-700">Supported apps:</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px]">Google Pay</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px]">PhonePe</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px]">Paytm</span>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4111 2222 3333 4444"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:border-[#22B573] focus:ring-1 focus:ring-[#22B573]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:border-[#22B573] focus:ring-1 focus:ring-[#22B573]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="888"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:border-[#22B573] focus:ring-1 focus:ring-[#22B573]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Name on card"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#22B573] focus:ring-1 focus:ring-[#22B573]"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "netbanking" && (
                  <div className="space-y-3">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Choose Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#22B573] focus:ring-1 focus:ring-[#22B573]"
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Federal Bank">Federal Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kerala Gramin Bank">Kerala Gramin Bank</option>
                    </select>
                    <p className="text-[11px] text-gray-500">
                      You will be routed to your bank’s simulated authorization portal.
                    </p>
                  </div>
                )}
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>256-bit SSL encrypted • 100% Secure RBI 3DS2 Gateway</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSimulatePayment(true)}
                  className="w-full py-3 px-4 rounded-xl bg-[#22B573] hover:bg-[#1fa769] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Pay ₹{formattedAmount} via PayU</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment(false)}
                  className="w-full py-2 px-3 text-[11px] text-gray-400 hover:text-gray-600 transition text-center cursor-pointer"
                >
                  Test Fail Payment (Sandbox simulation)
                </button>
              </div>
            </>
          )}

          {paymentStep === "processing" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-[#22B573] animate-spin" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Processing via PayU Gateway</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Authorizing your transaction securely. Please do not refresh or close this window...
                </p>
              </div>
            </div>
          )}

          {paymentStep === "success" && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-[#22B573] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#22B573]">Payment Confirmed</span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-950 mt-1">Masika Pass Activated!</h3>
                <p className="text-xs text-gray-500 mt-1.5 max-w-sm">
                  Thank you! Your payment has been authorized and your digital reading pass is now active.
                </p>
              </div>

              {/* Receipt Box */}
              <div className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl p-4 text-left space-y-2 text-xs font-mono text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-bold text-gray-900">{txnId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan:</span>
                  <span>{planName} ({billingCycle})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount Paid:</span>
                  <span className="font-bold text-[#22B573]">₹{formattedAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span>{new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                </div>
              </div>

              <div className="w-full pt-2">
                <button
                  type="button"
                  onClick={handleResetModal}
                  className="w-full py-3 px-4 rounded-xl bg-[#22B573] hover:bg-[#1fa769] text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer"
                >
                  Start Reading Digital Editions
                </button>
              </div>
            </div>
          )}

          {paymentStep === "error" && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-red-600">Payment Failed</span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-950 mt-1">Transaction Not Completed</h3>
                <p className="text-xs text-gray-500 mt-1.5 max-w-sm">
                  The test gateway returned a declined status. No amount was deducted. You can retry anytime.
                </p>
              </div>

              <div className="w-full pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentStep("checkout")}
                  className="w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={handleResetModal}
                  className="w-full py-2 px-3 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayUModal;
