import { createContext, useContext, useRef, type PropsWithChildren, type RefObject } from 'react';

type NavigationRequest = (proceed: () => void) => void;
const FormNavigationContext = createContext<RefObject<NavigationRequest | null> | null>(null);

export function FormNavigationProvider({ children }: PropsWithChildren) {
  const request = useRef<NavigationRequest | null>(null);
  return <FormNavigationContext.Provider value={request}>{children}</FormNavigationContext.Provider>;
}

export function useFormNavigationRequest() {
  return useContext(FormNavigationContext);
}
