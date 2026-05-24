import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';

export type AuthFlowPresentationMode = 'modal' | 'embedded';

let presentation: AuthFlowPresentationMode = 'modal';

export function getAuthFlowPresentation(): AuthFlowPresentationMode {
  return presentation;
}

export function AuthFlowPresentation({ mode, children }: { mode: AuthFlowPresentationMode; children: ReactNode }) {
  useLayoutEffect(() => {
    presentation = mode;
    return () => {
      presentation = 'modal';
    };
  }, [mode]);
  return children;
}
