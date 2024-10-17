"use client";
import { createSupabaseBrowserClient } from "@/lib/client/supabase";
import { AiOutlineLogout } from "react-icons/ai";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";

const SignOut = () => {
  const supabase = createSupabaseBrowserClient();
  const clearUser = useUserInfoStore((state) => state.clearUser);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
    window.location.href = process.env.NEXT_PUBLIC_AUTH_REDIRECT_TO_HOME || "/";
  };

  return (
    <div
      onClick={handleLogout}
      className=" flex flex-col text-4xl mt-1 cursor-pointer"
    >
      <AiOutlineLogout size={30} />
      <p className="text-xs mt-1 text-center">Out</p>
    </div>
  );
};

export default SignOut;
