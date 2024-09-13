import { User } from "@/types/types";
import { persist, createJSONStorage } from "zustand/middleware";
import { create } from "zustand";

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const emptyState: UserStore = {
  user: null,
  setUser: () => {},
  clearUser: () => {},
};

export const useUserInfoStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "userInfo",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
