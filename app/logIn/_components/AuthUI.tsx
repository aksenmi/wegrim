"use client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createSupabaseBrowserClient } from "@/lib/client/supabase";
import useHydrate from "@/hooks/useHydrate";

const AuthUI = () => {
  const isMount = useHydrate();

  const supabase = createSupabaseBrowserClient();

  if (!isMount) return null; //내부컴포넌트가 보여지기전에 딴거 보여주지마~
  return (
    <section className="w-10/12 p-10 ">
      <div className=" mx-auto max-w-[500px] rounded-lg ">
        <Auth
          redirectTo={process.env.NEXT_PUBLIC_AUTH_REDIRECT_TO}
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
          }}
          onlyThirdPartyProviders
          providers={["google"]}
        />
      </div>
    </section>
  );
};

export default AuthUI;
