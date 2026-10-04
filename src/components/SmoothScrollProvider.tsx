import React, { createContext, useContext, useCallback } from "react";

interface SmoothScrollContextType {
  scrollTo: (
    target: number | string | HTMLElement,
    options?: { offset?: number; immediate?: boolean }
  ) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  scrollTo: () => {},
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

/**
 * Lightweight, glitch-free smooth scrolling provider.
 * Does not hijack wheel or touch events, ensuring modals (Owner Portal, Cart, Customizer)
 * and dropdown menus (3-line mobile nav) scroll 100% smoothly without freezing.
 */
export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  const scrollTo = useCallback(
    (
      target: number | string | HTMLElement,
      options?: { offset?: number; immediate?: boolean }
    ) => {
      const behavior: ScrollBehavior = options?.immediate ? "auto" : "smooth";
      const offset = options?.offset ?? 0;

      if (typeof target === "number") {
        window.scrollTo({ top: Math.max(0, target + offset), behavior });
      } else if (typeof target === "string") {
        const el = document.querySelector(target);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY + offset;
          window.scrollTo({ top: Math.max(0, top), behavior });
        }
      } else if (target instanceof HTMLElement) {
        const top = target.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top: Math.max(0, top), behavior });
      }
    },
    []
  );

  return (
    <SmoothScrollContext.Provider value={{ scrollTo }}>
      {children}
    </SmoothScrollContext.Provider>
  );
};
