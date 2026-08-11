/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Sparkles, HelpCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { hasFeatureAccess } from '../utils/premiumGuard';
import UpgradeScreen from './UpgradeScreen';

interface FeatureGuardProps {
  userProfile: UserProfile;
  featureKey: string;
  onUpdatePlan: (plan: 'free' | 'pro' | 'premium') => void;
  children: React.ReactNode;
  /** Custom action on click if locked. If not provided, opens the Upgrade modal. */
  onLockedClick?: () => void;
  className?: string;
}

export default function FeatureGuard({
  children,
  className = ''
}: FeatureGuardProps) {
  return <div className={className}>{children}</div>;
}

/**
 * useFeatureGuard Hook
 * Always allows execution with full unlocked access.
 */
export function useFeatureGuard(
  userProfile: UserProfile,
  featureKey: string,
  onUpdatePlan: (plan: 'free' | 'pro' | 'premium') => void
) {
  const checkAccessAndRun = (action: () => void) => {
    action();
  };

  return {
    hasAccess: true,
    requiredPlan: 'premium' as const,
    featureName: '',
    isLimitReached: false,
    limitMessage: '',
    checkAccessAndRun,
    showDialog: false,
    setShowDialog: () => {},
    UpgradeDialog: null
  };
}

/**
 * withFeatureGuard Higher-Order Component
 * Returns the component without any locking overlay.
 */
export function withFeatureGuard<P extends object>(
  Component: React.ComponentType<P>,
  featureKey: string,
  onUpdatePlanPropName: keyof P & string = 'onUpdatePlan' as any,
  userProfilePropName: keyof P & string = 'userProfile' as any
) {
  return function GuardedComponent(props: P) {
    return <Component {...props} />;
  };
}

// Help component inside the guard file
interface XProps {
  className?: string;
  onClick?: () => void;
}
function X({ className, onClick }: XProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className} 
      onClick={onClick}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
