"use client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createSupabaseBrowserClient } from "@/lib/client/supabase";
import useHydrate from "@/hooks/useHydrate";
import { useEffect } from "react";
import useAuthStore from "@/hooks/useAuthStore";

const AuthUI = () => {
  const isMount = useHydrate();
  const supabase = createSupabaseBrowserClient();

  const setProvider = useAuthStore((state) => state.setProvider);
  const provider = useAuthStore((state) => state.provider);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      console.log("덷이타", data);
      if (data?.session?.user?.app_metadata?.provider) {
        setProvider(data.session.user.app_metadata.provider);
      }
    };

    fetchUser();
  }, [supabase, setProvider]);

  console.log(provider);

  if (!isMount) return null;

  return (
    <section className="w-10/12 p-10 ">
      <div className="mx-auto max-w-[500px] rounded-lg ">
        <Auth
          redirectTo={process.env.NEXT_PUBLIC_AUTH_REDIRECT_TO}
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          onlyThirdPartyProviders
          providers={["google"]}
        />
      </div>
    </section>
  );
};

export default AuthUI;
