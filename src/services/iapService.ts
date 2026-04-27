import { IAP_PRODUCT_IDS } from "../constants/appConstants";

export type IapCatalog = {
  monthly: { id: string; title: string; price: string | null };
  lifetime: { id: string; title: string; price: string | null };
};

export type IapEntitlements = {
  hasSubscription: boolean;
  hasLifetime: boolean;
};

export class IapUserCancelledError extends Error {
  constructor() {
    super("IAP_USER_CANCELLED");
    this.name = "IapUserCancelledError";
  }
}

export class IapPendingError extends Error {
  constructor() {
    super("IAP_PENDING");
    this.name = "IapPendingError";
  }
}

/**
 * Lazy-loaded react-native-iap module. We require() it the first time it's
 * actually needed (paywall open, purchase, restore) so the native side does
 * not get touched at app startup. Loading the module on a device that lacks
 * a Play Store debug context can crash the JS thread before any UI renders.
 */
let cachedIap: Record<string, any> | null = null;
let iapLoadFailed = false;
const getIap = (): Record<string, any> | null => {
  if (cachedIap) return cachedIap;
  if (iapLoadFailed) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedIap = require("react-native-iap") as Record<string, any>;
    return cachedIap;
  } catch {
    iapLoadFailed = true;
    return null;
  }
};

let initialized = false;
let purchaseListener: { remove?: () => void } | null = null;
let errorListener: { remove?: () => void } | null = null;

const isCancelError = (error: unknown): boolean => {
  const code = (error as any)?.code;
  const message = String((error as any)?.message ?? "").toLowerCase();
  return (
    code === "E_USER_CANCELLED" ||
    code === "E_USER_CANCELED" ||
    message.includes("cancel") ||
    message.includes("user cancelled")
  );
};

const isPendingError = (error: unknown): boolean => {
  const code = (error as any)?.code;
  return code === "E_DEFERRED_PAYMENT" || code === "E_ITEM_UNAVAILABLE_PENDING";
};

const ackPurchase = async (purchase: any, isConsumable: boolean): Promise<void> => {
  const IAP = getIap();
  if (!IAP || !purchase) return;
  try {
    if (typeof IAP.finishTransaction === "function") {
      await IAP.finishTransaction({ purchase, isConsumable });
      return;
    }
    if (typeof IAP.acknowledgePurchaseAndroid === "function" && purchase.purchaseToken) {
      await IAP.acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
    }
  } catch {
    // swallow — Google Play retries acknowledgement
  }
};

export const initIap = async (): Promise<boolean> => {
  if (initialized) return true;
  const IAP = getIap();
  if (!IAP || typeof IAP.initConnection !== "function") return false;
  try {
    await IAP.initConnection();

    if (typeof IAP.purchaseUpdatedListener === "function" && !purchaseListener) {
      purchaseListener = IAP.purchaseUpdatedListener(async (purchase: any) => {
        const productId = purchase?.productId ?? purchase?.productIds?.[0];
        if (!productId) return;
        await ackPurchase(purchase, false);
      });
    }
    if (typeof IAP.purchaseErrorListener === "function" && !errorListener) {
      errorListener = IAP.purchaseErrorListener(() => {
        // errors are surfaced per-call below; listener is a safety net
      });
    }

    initialized = true;
    return true;
  } catch {
    return false;
  }
};

export const endIapConnection = async (): Promise<void> => {
  const IAP = getIap();
  try {
    purchaseListener?.remove?.();
    errorListener?.remove?.();
    purchaseListener = null;
    errorListener = null;
    if (IAP && typeof IAP.endConnection === "function") {
      await IAP.endConnection();
    }
  } catch {
    // ignore
  } finally {
    initialized = false;
  }
};

export const getIapCatalog = async (): Promise<IapCatalog> => {
  const fallback: IapCatalog = {
    monthly: { id: IAP_PRODUCT_IDS.subscriptionMonthly, title: "Premium mensual", price: null },
    lifetime: { id: IAP_PRODUCT_IDS.lifetime, title: "Premium de por vida", price: null },
  };

  const ready = await initIap();
  const IAP = getIap();
  if (!ready || !IAP || typeof IAP.fetchProducts !== "function") return fallback;

  try {
    const products = (await IAP.fetchProducts({
      skus: [IAP_PRODUCT_IDS.subscriptionMonthly, IAP_PRODUCT_IDS.lifetime],
      type: "all",
    })) as any[];
    const mapById = new Map<string, any>((products ?? []).map((p: any) => [p.id, p]));
    const monthlyProduct = mapById.get(IAP_PRODUCT_IDS.subscriptionMonthly) as any;
    const lifetimeProduct = mapById.get(IAP_PRODUCT_IDS.lifetime) as any;
    return {
      monthly: {
        id: IAP_PRODUCT_IDS.subscriptionMonthly,
        title: monthlyProduct?.title ?? fallback.monthly.title,
        price: monthlyProduct?.displayPrice ?? fallback.monthly.price,
      },
      lifetime: {
        id: IAP_PRODUCT_IDS.lifetime,
        title: lifetimeProduct?.title ?? fallback.lifetime.title,
        price: lifetimeProduct?.displayPrice ?? fallback.lifetime.price,
      },
    };
  } catch {
    return fallback;
  }
};

export const getIapEntitlements = async (): Promise<IapEntitlements> => {
  const ready = await initIap();
  const IAP = getIap();
  if (!ready || !IAP || typeof IAP.getAvailablePurchases !== "function") {
    return { hasSubscription: false, hasLifetime: false };
  }

  try {
    const purchases = await IAP.getAvailablePurchases({
      onlyIncludeActiveItems: true,
      alsoPublishToEventListener: false,
    });
    const list = (purchases ?? []) as any[];

    for (const purchase of list) {
      const productId = purchase?.productId ?? purchase?.productIds?.[0];
      if (!productId) continue;
      if (purchase?.purchaseState === 1 && !purchase?.isAcknowledgedAndroid) {
        await ackPurchase(purchase, false);
      }
    }

    const productIds = new Set(list.map((purchase: any) => purchase.productId ?? purchase.productIds?.[0]));
    return {
      hasSubscription: productIds.has(IAP_PRODUCT_IDS.subscriptionMonthly),
      hasLifetime: productIds.has(IAP_PRODUCT_IDS.lifetime),
    };
  } catch {
    return { hasSubscription: false, hasLifetime: false };
  }
};

const doPurchase = async (sku: string, type: "subs" | "in-app"): Promise<void> => {
  const ready = await initIap();
  const IAP = getIap();
  if (!ready || !IAP || typeof IAP.requestPurchase !== "function") {
    throw new Error("IAP_UNAVAILABLE");
  }
  try {
    const result = await IAP.requestPurchase({
      request: {
        ios: { sku },
        android: { skus: [sku] },
      },
      type,
    });
    const purchases = Array.isArray(result) ? result : result ? [result] : [];
    for (const purchase of purchases) {
      await ackPurchase(purchase, false);
    }
  } catch (error) {
    if (isCancelError(error)) throw new IapUserCancelledError();
    if (isPendingError(error)) throw new IapPendingError();
    throw error;
  }
};

export const purchasePremiumMonthly = async (): Promise<void> => {
  await doPurchase(IAP_PRODUCT_IDS.subscriptionMonthly, "subs");
};

export const purchasePremiumLifetime = async (): Promise<void> => {
  await doPurchase(IAP_PRODUCT_IDS.lifetime, "in-app");
};

export const restoreIapPurchases = async (): Promise<void> => {
  const ready = await initIap();
  const IAP = getIap();
  if (!ready || !IAP) throw new Error("IAP_UNAVAILABLE");
  if (typeof IAP.restorePurchases === "function") {
    await IAP.restorePurchases();
    return;
  }
  await getIapEntitlements();
};
