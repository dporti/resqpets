import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PLANS, PlanId, PlanFeatures, PlanLimits, PLAN_ORDER } from './plans';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface PlanUsage { animals: number; users: number; storage_gb: number }

interface PlanContextValue {
  planId: PlanId;
  plan: typeof PLANS[PlanId];
  features: PlanFeatures;
  limits: PlanLimits;
  usage: PlanUsage;
  planExpiresAt?: string;
  loading: boolean;
  can: (feature: keyof PlanFeatures) => boolean;
  withinLimit: (type: keyof PlanLimits, current: number) => boolean;
  requiredPlanFor: (feature: keyof PlanFeatures) => typeof PLANS[PlanId] | undefined;
  setPlanId: (id: PlanId) => void;
  refreshPlan: () => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [planId, setPlanIdState] = useState<PlanId>('free');
  const [usage, setUsage] = useState<PlanUsage>({ animals: 0, users: 0, storage_gb: 0 });
  const [planExpiresAt, setPlanExpiresAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await api.get<{ plan_id: PlanId; usage: PlanUsage; plan_expires_at?: string }>('/billing/plan');
      setPlanIdState((data.plan_id || 'free') as PlanId);
      setUsage(data.usage);
      setPlanExpiresAt(data.plan_expires_at);
    } catch {
      // Default to free on error
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const plan = PLANS[planId] || PLANS.free;

  const can = (feature: keyof PlanFeatures): boolean => {
    const val = plan.features[feature];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val !== 'basic' && val !== 'email';
    return false;
  };

  const withinLimit = (type: keyof PlanLimits, current: number): boolean => {
    const limit = plan.limits[type];
    return limit === -1 || current <= limit;
  };

  const requiredPlanFor = (feature: keyof PlanFeatures) => {
    return PLAN_ORDER.map(id => PLANS[id]).find(p => {
      const val = p.features[feature];
      return val === true || (typeof val === 'string' && val !== 'basic' && val !== 'email');
    });
  };

  const setPlanId = (id: PlanId) => setPlanIdState(id);

  return (
    <PlanContext.Provider value={{
      planId, plan, features: plan.features as PlanFeatures,
      limits: plan.limits as PlanLimits,
      usage, planExpiresAt, loading,
      can, withinLimit, requiredPlanFor,
      setPlanId, refreshPlan: fetchPlan,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    // Fallback for components outside provider (shouldn't happen in practice)
    const plan = PLANS.free;
    return {
      planId: 'free', plan, features: plan.features as PlanFeatures,
      limits: plan.limits as PlanLimits,
      usage: { animals: 0, users: 0, storage_gb: 0 },
      loading: false,
      can: () => false,
      withinLimit: () => true,
      requiredPlanFor: () => PLANS.starter,
      setPlanId: () => {},
      refreshPlan: () => {},
    };
  }
  return ctx;
}
