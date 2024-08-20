import { User } from "@/types/user";
import { persist, createJSONStorage } from "zustand/middleware";
import { createWithEqualityFn } from "zustand/traditional";

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

export const useUserInfoStore = createWithEqualityFn<UserStore>()(
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
