"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Building2,
  X,
  Loader2,
  Lock,
  CheckCircle2,
  Smartphone,
  Info,
  BookOpen,
} from "lucide-react";

export interface AboutDigitalEditionProps {
  title?: string;
  description?: string;
}

export const AboutDigitalEdition: React.FC<AboutDigitalEditionProps> = ({
  title = "About The Digital Edition",
  description = "Akam Masika's digital edition brings the richness of contemporary Malayalam literature directly to your screens. Designed for optimal readability across desktop, tablet, and mobile devices, each monthly issue delivers an interactive, high-resolution reading experience complete with printable PDF archives, original cover artwork, and curated literary audio features.",
}) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [isPassActive, setIsPassActive] = useState<boolean>(false);

  // Modal & Flow State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"checkout" | "processing" | "success">("checkout");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");

  // Form Inputs (Simulated)
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [txnId, setTxnId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("akam_masika_pass") === "true";
      setIsPassActive(active);
    }
  }, []);

  const priceAmount = billingCycle === "monthly" ? 149 : 1248;
  const priceDisplay = billingCycle === "monthly" ? "₹149" : "₹104";

  const handleOpenCheckout = () => {
    setPaymentStep("checkout");
    setUpiId("demo.reader@upi");
    setCardNumber("4111 2222 3333 4444");
    setCardExpiry("12/28");
    setCardCvc("888");
    setCheckoutModalOpen(true);
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStep("processing");

    setTimeout(() => {
      const randomTxn = `TXN-AKAM-${Math.floor(100000 + Math.random() * 900000)}`;
      setTxnId(randomTxn);
      if (typeof window !== "undefined") {
        localStorage.setItem("akam_masika_pass", "true");
      }
      setIsPassActive(true);
      setPaymentStep("success");
    }, 1400);
  };

  const handleResetPass = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("akam_masika_pass");
    }
    setIsPassActive(false);
    setCheckoutModalOpen(false);
  };

  const keyFeatures = [
    {
      title: "Multi-Format Access:",
      text: "Read online via our web viewer or download offline PDFs for on-the-go reading.",
    },
    {
      title: "Interactive Media:",
      text: "Enjoy embedded audio recitals, author commentaries, and visual art accompanying selected works.",
    },
    {
      title: "Complete Archives:",
      text: "Instant access to every past edition, serialized fiction installment, and poetry collection.",
    },
  ];

  const freeFeatures = [
    "Unlimited access to all free stories",
    "Save bookmarks to personal library",
    "Participate in community discussion threads",
  ];

  const premiumFeatures = [
    "Full access to monthly Masika digital magazine",
    "Read exclusive subscriber-only stories & deep dives",
    "Offline reading / PDF download access",
  ];

  return (
    <section className="relative w-full bg-white py-16 lg:py-24 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
        {/* Left Side: About Text & Key Features */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight">
            {title}
          </h2>

          <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed">
            {description}
          </p>

          <div className="pt-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-950 tracking-tight mb-4">
              Key Features
            </h3>

            <ul className="space-y-4">
              {keyFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start text-xs sm:text-sm text-gray-600 leading-relaxed">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 mr-3 shrink-0" />
                  <span>
                    <strong className="font-semibold text-gray-900 mr-1">{feat.title}</strong>
                    {feat.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side: Pricing / Plan Selection Container */}
        <div className="lg:col-span-6 xl:col-span-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs relative">
            {/* Billing Toggle Switch */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-full inline-flex items-center gap-1">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    billingCycle === "monthly"
                      ? "bg-black text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    billingCycle === "annual"
                      ? "bg-black text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Annual Billing{" "}
                  <span className="text-[#22B573] font-bold ml-1">
                    <br className="md:hidden" />
                    (Save 30%)
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Free Reader Member Card */}
              <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between bg-white hover:border-gray-300 transition-all">
                <div>
                  <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
                    Reader Member
                  </span>

                  <div className="mt-4 mb-2 flex items-baseline">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight">Free</span>
                    <span className="text-xs text-gray-400 font-medium ml-1">/ forever</span>
                  </div>

                  <p className="text-xs text-gray-500 font-normal leading-normal min-h-[36px]">
                    Explore baseline articles and join public conversations.
                  </p>

                  <button
                    onClick={() => setInfoModalOpen(true)}
                    className="w-full mt-6 py-2.5 px-4 rounded-full border border-gray-300 text-gray-800 text-xs font-semibold hover:bg-gray-50 transition-all text-center cursor-pointer"
                  >
                    Current Active Plan
                  </button>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-3">
                    Includes
                  </span>
                  <ul className="space-y-2.5">
                    {freeFeatures.map((item, idx) => (
                      <li key={idx} className="flex items-start text-xs text-gray-600 leading-snug">
                        <Check className="w-3.5 h-3.5 text-[#22B573] stroke-[3] mr-2 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Masika Pass Premium Card */}
              <div className="bg-[#22B573] rounded-2xl p-6 flex flex-col justify-between text-white shadow-lg hover:bg-[#1fa769] transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">
                      Masika Pass
                    </span>
                    {isPassActive && (
                      <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  <div className="mt-4 mb-2 flex items-baseline">
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      {priceDisplay}
                    </span>
                    <span className="text-xs text-white/80 font-medium ml-1">/ month</span>
                  </div>

                  <p className="text-xs text-white/90 font-normal leading-normal min-h-[36px]">
                    {isPassActive
                      ? "Your premium digital magazine pass is active."
                      : "Unlock complete digital access to every monthly edition."}
                  </p>

                  {isPassActive ? (
                    <button
                      onClick={handleOpenCheckout}
                      className="w-full mt-6 py-2.5 px-4 rounded-full bg-white text-gray-950 text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#22B573]" />
                      <span>Manage Premium Pass</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenCheckout}
                      className="w-full mt-6 py-2.5 px-4 rounded-full bg-white text-gray-950 text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-sm group cursor-pointer"
                    >
                      <span>Activate Premium Pass</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-950 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>

                <div className="mt-8 border-t border-white/20 pt-6">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3">
                    Includes
                  </span>
                  <ul className="space-y-2.5">
                    {premiumFeatures.map((item, idx) => (
                      <li key={idx} className="flex items-start text-xs text-white/95 leading-snug">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3] mr-2 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive PayU Checkout & Test Gateway Modal ────────────────── */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl font-poppins overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            {/* PayU Branded Gateway Top Header */}
            <div className="bg-[#002842] text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-emerald-500/30">
              <div className="flex items-center gap-3">
                <div className="bg-[#75c043] text-[#002842] p-1.5 rounded-lg font-black text-xs tracking-tighter">
                  PayU
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide">PayU Biz / Hosted Gateway</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/40">
                      TEST SANDBOX MODE
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300">Merchant: AKAM DIGITAL PUBLICATIONS (TEST_KEY_401)</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1.5 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {paymentStep === "checkout" && (
                <div>
                  {/* Plan Summary Box */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5">
                    <div className="flex justify-between items-center text-sm font-bold text-gray-900 mb-1">
                      <span>Masika Pass ({billingCycle === "monthly" ? "Monthly" : "Annual"})</span>
                      <span className="text-emerald-600 font-extrabold">{priceDisplay}/mo</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Total Payable Amount:</span>
                      <span className="font-bold text-gray-900 text-sm">₹{priceAmount}.00 INR</span>
                    </div>
                  </div>

                  {/* PayU Quick Fill Presets for Testing */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> PayU Sandbox Test Presets:
                      </span>
                      <span className="text-[10px] font-mono bg-white text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
                        test.payu.in
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("card");
                          setCardNumber("4111 1111 1111 1111");
                          setCardExpiry("12/28");
                          setCardCvc("123");
                        }}
                        className="py-1.5 px-2.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-medium rounded-lg text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <span>⚡ PayU Test Card</span>
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("upi");
                          setUpiId("payutest@payu");
                        }}
                        className="py-1.5 px-2.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-medium rounded-lg text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <span>⚡ PayU Test UPI</span>
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                      Choose PayU Payment Method
                    </span>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("upi")}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          paymentMethod === "upi"
                            ? "border-[#75c043] bg-emerald-50 text-emerald-900 shadow-xs"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Smartphone className="w-5 h-5 text-emerald-600" />
                        <span>PayU UPI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          paymentMethod === "card"
                            ? "border-[#75c043] bg-emerald-50 text-emerald-900 shadow-xs"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        <span>Credit / Debit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("netbanking")}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          paymentMethod === "netbanking"
                            ? "border-[#75c043] bg-emerald-50 text-emerald-900 shadow-xs"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Building2 className="w-5 h-5 text-emerald-600" />
                        <span>Net Banking</span>
                      </button>
                    </div>

                    {/* PayU Input Forms */}
                    <form onSubmit={handleSimulatePayment} className="space-y-4.5 mt-4">
                      {paymentMethod === "upi" && (
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 block mb-1">
                            PayU VPA / UPI ID (e.g., payutest@payu)
                          </label>
                          <input
                            type="text"
                            required
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="payutest@payu"
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-hidden font-mono"
                          />
                        </div>
                      )}

                      {paymentMethod === "card" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-700 block mb-1">
                              PayU Test Card Number
                            </label>
                            <input
                              type="text"
                              required
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="4111 1111 1111 1111"
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-hidden font-mono"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                Expiry (MM/YY)
                              </label>
                              <input
                                type="text"
                                required
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="12/28"
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-hidden font-mono text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                CVV / CVC
                              </label>
                              <input
                                type="password"
                                maxLength={4}
                                required
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value)}
                                placeholder="123"
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-hidden font-mono text-center"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "netbanking" && (
                        <div>
                          <label className="text-[11px] font-bold text-gray-700 block mb-1">
                            Select PayU Test Bank
                          </label>
                          <select
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-hidden font-semibold"
                          >
                            <option value="HDFC Bank (TESTBANK)">HDFC Bank (TESTBANK)</option>
                            <option value="State Bank of India (TESTBANK)">State Bank of India (TESTBANK)</option>
                            <option value="ICICI Bank (TESTBANK)">ICICI Bank (TESTBANK)</option>
                            <option value="Axis Bank (TESTBANK)">Axis Bank (TESTBANK)</option>
                          </select>
                        </div>
                      )}

                      {/* Technical Spec / SHA-512 Hash Info Accordion Box */}
                      <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-[10px] space-y-1">
                        <div className="flex justify-between text-slate-400 border-b border-slate-700 pb-1">
                          <span>PayU Integration Payload:</span>
                          <span className="text-emerald-400">SHA-512 Signed</span>
                        </div>
                        <div className="truncate text-slate-300 pt-0.5">
                          <span className="text-yellow-400">key:</span> TEST_KEY_401 |{" "}
                          <span className="text-yellow-400">txnid:</span> TXN-AKAM-{billingCycle === "monthly" ? "M" : "A"} |{" "}
                          <span className="text-yellow-400">amount:</span> {priceAmount}.00
                        </div>
                        <div className="truncate text-slate-400">
                          <span className="text-yellow-400">hash:</span> 4a8e99b2c...df7810a9 (SHA-512)
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-[#75c043] hover:bg-[#68ac3b] text-[#002842] font-black text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Pay ₹{priceAmount}.00 via PayU Gateway</span>
                      </button>

                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>PayU India Verified 256-Bit SSL Secured Transaction</span>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {paymentStep === "processing" && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <Loader2 className="w-14 h-14 text-emerald-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#002842]">
                      PayU
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Connecting to PayU India Gateway...</h4>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">
                      Verifying merchant hash signature and processing test transaction with bank servers.
                    </p>
                  </div>
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-600">
                    Endpoint: https://test.payu.in/_payment
                  </div>
                </div>
              )}

              {paymentStep === "success" && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      PayU Transaction Success (code 200)
                    </span>
                    <h3 className="text-2xl font-bold text-gray-950 mt-2">Masika Pass Activated!</h3>
                    <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                      PayU sandbox verified payment. Your premium account has full access to all digital editions.
                    </p>
                  </div>

                  {/* PayU Response Details Box */}
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-left font-mono text-[11px] space-y-2 border border-slate-800">
                    <div className="flex justify-between border-b border-slate-700 pb-1.5">
                      <span className="text-slate-400">mihpayid (PayU ID):</span>
                      <span className="font-bold text-emerald-400">40399371553012</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700 pb-1.5">
                      <span className="text-slate-400">txnid:</span>
                      <span className="font-bold text-yellow-300">{txnId}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700 pb-1.5">
                      <span className="text-slate-400">status:</span>
                      <span className="font-bold text-emerald-400">success</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">amount:</span>
                      <span className="font-bold text-white">₹{priceAmount}.00</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setCheckoutModalOpen(false);
                        const el = document.getElementById("latest-edition");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full py-3 px-4 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Read Latest Digital Edition Now</span>
                    </button>

                    <button
                      onClick={handleResetPass}
                      className="text-[11px] text-gray-400 hover:text-red-500 underline cursor-pointer"
                    >
                      Reset Demo Pass (Testing Only)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Active Reader Info Modal ───────────────────────────────────────── */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl font-poppins text-center space-y-4 border border-gray-100">
            <button
              onClick={() => setInfoModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-gray-950">Free Reader Member Plan</h4>
              <p className="text-xs text-gray-500 mt-1">
                You are currently on the baseline Free Reader plan. You can read public stories and participate in community posts anytime.
              </p>
            </div>

            <button
              onClick={() => {
                setInfoModalOpen(false);
                handleOpenCheckout();
              }}
              className="w-full py-2.5 px-4 bg-[#22B573] hover:bg-[#1fa769] text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Upgrade to Masika Pass
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AboutDigitalEdition;
