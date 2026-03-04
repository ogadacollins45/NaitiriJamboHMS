import React, { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  // Determine initial state based on viewport width and localStorage
  const getInitialState = () => {
    const stored = localStorage.getItem("sidebarCollapsed");
    if (stored !== null) {
      return stored === "true";
    }
    // Default: collapsed on tablet, expanded on desktop
    return window.innerWidth < 1024;
  };

  const [isCollapsed, setIsCollapsed] = useState(getInitialState);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed.toString());
  }, [isCollapsed]);

  // Handle responsive behavior on window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Auto-close mobile menu when resizing to desktop
      if (width >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileMenuOpen,
        toggleSidebar,
        toggleMobileMenu,
        closeMobileMenu,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
