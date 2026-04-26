import { PremiumState } from "../types/models";
import { getCachedPremiumState, setCachedPremiumState } from "./localStorage";
import { getIapEntitlements } from "./iapService";

const toPremiumState = (entitlements: { hasSubscription: boolean; hasLifetime: boolean }): PremiumState => ({
  hasSubscription: entitlements.hasSubscription,
  hasLifetime: entitlements.hasLifetime,
  isPremium: entitlements.hasSubscription || entitlements.hasLifetime,
  updatedAt: new Date().toISOString(),
});

export const getInitialPremiumState = async (): Promise<PremiumState> => {
  const cached = await getCachedPremiumState();
  return (
    cached ?? {
      hasSubscription: false,
      hasLifetime: false,
      isPremium: false,
      updatedAt: new Date(0).toISOString(),
    }
  );
};

export const refreshPremiumState = async (): Promise<PremiumState> => {
  const entitlements = await getIapEntitlements();
  const state = toPremiumState(entitlements);
  await setCachedPremiumState(state);
  return state;
};
