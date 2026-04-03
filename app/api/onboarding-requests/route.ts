import {
  createOnboardingRequest,
  onboardingRouteInfo,
  onboardingRouteOptions
} from '@/lib/server/onboarding-request';

export const GET = onboardingRouteInfo;
export const POST = createOnboardingRequest;
export const OPTIONS = onboardingRouteOptions;
