import React from "react";
import { Titan_One } from "next/font/google";

const titan = Titan_One({
  subsets: ["latin"],
  weight: "400",
});

const Title = () => {
  return (
    <div className="flex items-center justify-center w-full custom-title">
      <h1
        className={`relative inline-block text-textColor text-8xl ${titan.className}`}
      >
        <span>w</span>
        <span>e</span>
        <span>g</span>
        <span>r</span>
        <span>i</span>
        <span>m</span>
      </h1>
    </div>
  );
};

export default Title;
