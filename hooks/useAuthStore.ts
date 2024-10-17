import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  provider: string | null;
  setProvider: (provider: string | null) => void;
}

const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      provider: null,
      setProvider: (provider: string | null) => set({ provider }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;
