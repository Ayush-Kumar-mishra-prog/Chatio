import { createContext, useCallback, useContext, useState } from "react";

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates((prev) => ({ ...prev, [key]: isLoading }));
  }, []);

  const isLoading = useCallback(
    (key) => loadingStates[key] || false,
    [loadingStates],
  );

  const value = { setLoading, isLoading };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
};
