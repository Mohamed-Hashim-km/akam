import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PayUInitiateParams {
  userId: string;
  email: string;
  name?: string;
  phone?: string;
  planType?: string;
  productInfo?: string;
  amount?: number;
}

export interface PayUInitiateResponse {
  actionUrl: string;
  params: {
    key: string;
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    phone: string;
    surl: string;
    furl: string;
    hash: string;
    udf1: string;
    udf2: string;
    udf3: string;
    udf4: string;
    udf5: string;
    service_provider?: string;
  };
}

export interface PayUVerificationResult {
  isValid: boolean;
  status: string;
  txnid: string;
  userId: string;
  planType: string;
  amount: string;
  errorMessage?: string;
  mihpayid?: string;
  bankRefNum?: string;
}

@Injectable()
export class PayUService {
  private readonly logger = new Logger(PayUService.name);

  constructor(private readonly configService: ConfigService) {}

  getMerchantKey(): string {
    return this.configService.get<string>('PAYU_MERCHANT_KEY') || '0OlbkD';
  }

  getSalt(): string {
    return this.configService.get<string>('PAYU_SALT') || '3Qx7VaYBOHRBdvqkXhGJ1a9wBxH2T71k';
  }

  getPaymentUrl(): string {
    return this.configService.get<string>('PAYU_PAYMENT_URL') || 'https://test.payu.in/_payment';
  }

  getBackendUrl(): string {
    return this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
  }

  getFrontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';
  }

  getEnvironment(): string {
    return this.configService.get<string>('PAYU_ENV') || 'TEST';
  }

  private readonly pendingTxns = new Map<
    string,
    { userId: string; planType: string; amount: string; email: string; createdAt: number }
  >();

  setPendingTxn(txnid: string, info: { userId: string; planType: string; amount: string; email: string }) {
    this.pendingTxns.set(txnid, { ...info, createdAt: Date.now() });
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, entry] of this.pendingTxns.entries()) {
      if (entry.createdAt < twoHoursAgo) {
        this.pendingTxns.delete(id);
      }
    }
  }

  getPendingTxn(txnid: string) {
    return this.pendingTxns.get(txnid);
  }

  /**
   * Generate SHA-512 Hash and prepare PayU Hosted Checkout form fields
   */
  createPaymentPayload(data: PayUInitiateParams): PayUInitiateResponse {
    const key = this.getMerchantKey();
    const salt = this.getSalt();
    const actionUrl = this.getPaymentUrl();
    const backendUrl = this.getBackendUrl();

    // Unique transaction ID (must be alphanumeric, max 30 chars)
    const timestamp = Date.now().toString();
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const txnid = `AKAM_${timestamp.slice(-8)}_${randSuffix}`;

    const amountNum = typeof data.amount === 'number' && data.amount > 0 ? data.amount : 1;
    const formattedAmount = amountNum.toFixed(2);

    const productinfo = data.productInfo
      ? data.productInfo.substring(0, 50)
      : (data.planType === 'SIX_MONTH' ? '6-Month Akam Digital Pass' : 'Akam Digital Subscription');

    const firstname = (data.name && data.name.trim()) ? data.name.trim().split(' ')[0] : 'Reader';
    const email = data.email ? data.email.trim().toLowerCase() : 'reader@akamdigital.com';
    const phone = data.phone ? data.phone.trim() : '9999999999';

    const udf1 = data.userId;
    const udf2 = data.planType || 'SIX_MONTH';
    const udf3 = '';
    const udf4 = '';
    const udf5 = '';

    // Track pending transaction
    this.setPendingTxn(txnid, {
      userId: data.userId,
      planType: data.planType || 'SIX_MONTH',
      amount: formattedAmount,
      email,
    });

    // Callback URLs
    const surl = `${backendUrl}/api/subscription/payu/callback`;
    const furl = `${backendUrl}/api/subscription/payu/callback`;

    // SHA-512 Hash string formula:
    const hashSequence = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashSequence).digest('hex').toLowerCase();

    this.logger.log(`[PayU] Generated checkout payload for txnid=${txnid}, userId=${data.userId}, amount=₹${formattedAmount}`);

    return {
      actionUrl,
      params: {
        key,
        txnid,
        amount: formattedAmount,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        service_provider: 'payu_paisa',
      },
    };
  }

  /**
   * Generate SHA-512 Hash specifically formatted for PayU Bolt popup checkout
   */
  createBoltPayload(data: PayUInitiateParams) {
    const key = this.getMerchantKey();
    const salt = this.getSalt();
    const backendUrl = this.getBackendUrl();

    const timestamp = Date.now().toString();
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const isEventTicket = data.planType === 'EVENT_TICKET';
    const txnid = isEventTicket
      ? `EVT_${timestamp.slice(-8)}_${randSuffix}`
      : `AKAM_${timestamp.slice(-8)}_${randSuffix}`;

    const amountNum = typeof data.amount === 'number' && data.amount > 0 ? data.amount : 1;
    const formattedAmount = amountNum.toFixed(2);

    const productinfo = data.productInfo
      ? data.productInfo.substring(0, 50)
      : (data.planType === 'SIX_MONTH' ? '6-Month Akam Digital Pass' : 'Akam Digital Subscription');

    const firstname = (data.name && data.name.trim()) ? data.name.trim().split(' ')[0] : 'Reader';
    const email = data.email ? data.email.trim().toLowerCase() : 'reader@akamdigital.com';
    const phone = data.phone ? data.phone.trim() : '9999999999';

    // Track pending transaction
    this.setPendingTxn(txnid, {
      userId: data.userId,
      planType: data.planType || (isEventTicket ? 'EVENT_TICKET' : 'SIX_MONTH'),
      amount: formattedAmount,
      email,
    });

    const callbackPath = isEventTicket ? '/api/events/payu/callback' : '/api/subscription/payu/callback';
    const surl = `${backendUrl}${callbackPath}`;
    const furl = `${backendUrl}${callbackPath}`;

    // Exact formula for PayU Bolt modal popup:
    const hashSequence = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashSequence).digest('hex').toLowerCase();

    this.logger.log(`[PayU Bolt] Generated bolt payload for txnid=${txnid}, userId=${data.userId}, planType=${data.planType}`);

    return {
      key,
      txnid,
      amount: formattedAmount,
      productinfo,
      firstname,
      email,
      phone,
      surl,
      furl,
      hash,
      mode: 'dropout',
    };
  }

  /**
   * Verify PayU callback reverse hash
   */
  verifyResponseHash(body: Record<string, any>): PayUVerificationResult {
    const key = this.getMerchantKey();
    const salt = this.getSalt();

    this.logger.log(`[PayU Raw Callback Body]: ${JSON.stringify(body)}`);

    const rawStatus = String(body.status || '');
    const status = rawStatus.toLowerCase();
    const txnid = String(body.txnid || '');
    const amount = String(body.amount || '');
    const productinfo = String(body.productinfo || '');
    const firstname = String(body.firstname || '');
    const email = String(body.email || '');
    const udf1 = String(body.udf1 || '');
    const udf2 = String(body.udf2 || 'SIX_MONTH');
    const udf3 = String(body.udf3 || '');
    const udf4 = String(body.udf4 || '');
    const udf5 = String(body.udf5 || '');
    const additionalCharges = String(body.additional_charges || body.additionalCharges || '');
    const receivedHash = String(body.hash || '').toLowerCase();

    // Check multiple candidate hash sequences to prevent subtle formatting mismatches:
    const candidates: string[] = [];

    // Candidate 1: Standard with additional_charges
    if (additionalCharges) {
      candidates.push(
        `${additionalCharges}|${salt}|${rawStatus}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`,
      );
      candidates.push(
        `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`,
      );
    }

    // Candidate 2: Standard without additional_charges
    candidates.push(
      `${salt}|${rawStatus}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`,
    );
    candidates.push(
      `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`,
    );

    let hashMatches = false;
    for (const cand of candidates) {
      const candHash = crypto.createHash('sha512').update(cand).digest('hex').toLowerCase();
      if (receivedHash && candHash === receivedHash) {
        hashMatches = true;
        break;
      }
    }

    const isSuccessStatus = status === 'success' || String(body.unmappedstatus || '').toLowerCase() === 'captured';

    // In test environment, or if hash matches, consider valid:
    const isValid = hashMatches || (this.getEnvironment() === 'TEST' && isSuccessStatus);

    this.logger.log(
      `[PayU] Reverse hash validation for txnid=${txnid}: hashMatches=${hashMatches}, isValid=${isValid}, status=${status}`,
    );

    const pending = this.getPendingTxn(txnid);
    const resolvedUserId = udf1 || pending?.userId || '';
    const isEvtTxn = txnid.startsWith('EVT_') || String(productinfo || '').toLowerCase().includes('ticket');
    const resolvedPlanType = udf2 || pending?.planType || (isEvtTxn ? 'EVENT_TICKET' : 'SIX_MONTH');

    return {
      isValid,
      status: isSuccessStatus ? 'success' : status,
      txnid,
      userId: resolvedUserId,
      planType: resolvedPlanType,
      amount,
      errorMessage: body.error_Message || body.field9 || body.unmappedstatus,
      mihpayid: body.mihpayid,
      bankRefNum: body.bank_ref_num,
    };
  }


  /**
   * Public config information for frontend
   */
  getPublicConfig() {
    return {
      key: this.getMerchantKey(),
      env: this.getEnvironment(),
      paymentUrl: this.getPaymentUrl(),
    };
  }
}
