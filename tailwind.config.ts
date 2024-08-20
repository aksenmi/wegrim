// tailwind.config.js
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FF7777",
        textColor: "#e2e8f0",
      },
      keyframes: {
        bounce: {
          "0%": {
            transform: "translateY(0)",
            textShadow:
              "0 1px 0 #CCC, 0 2px 0 #CCC, 0 3px 0 #CCC, 0 4px 0 #CCC, 0 5px 0 #CCC, 0 6px 0 #CCC, 0 7px 0 #CCC, 0 8px 0 #CCC, 0 9px 0 #CCC, 0 10px 10px rgba(0, 0, 0, 0.4)",
          },
          "100%": {
            transform: "translateY(-20px)",
            textShadow:
              "0 1px 0 #CCC, 0 2px 0 #CCC, 0 3px 0 #CCC, 0 4px 0 #CCC, 0 5px 0 #CCC, 0 6px 0 #CCC, 0 7px 0 #CCC, 0 8px 0 #CCC, 0 9px 0 #CCC, 0 50px 25px rgba(0, 0, 0, 0.2)",
          },
        },
      },
      animation: {
        bounce: "bounce 0.3s ease infinite alternate",
      },
    },
  },
  plugins: [],
};

export default config;
