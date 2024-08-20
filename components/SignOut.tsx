"use client";
import { createSupabaseBrowserClient } from "@/lib/client/supabase";
import { AiOutlineLogout } from "react-icons/ai";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import useUserStore from "@/hooks/useUserStore";

const SignOut = () => {
  const supabase = createSupabaseBrowserClient();
  const clearUser = useUserInfoStore((state) => state.clearUser);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
    window.location.href = process.env.NEXT_PUBLIC_AUTH_REDIRECT_TO_HOME || "/";
  };

  return (
    <header className="h-[50px] bg-white">
      <section className="px-6 h-full">
        <div className="h-full flex flex-row justify-between items-center">
          <div
            onClick={handleLogout}
            className="flex flex-row items-center gap-2 cursor-pointer"
          >
            <AiOutlineLogout size={30} />
          </div>
        </div>
      </section>
    </header>
  );
};

export default SignOut;
