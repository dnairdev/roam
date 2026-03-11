import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["DM Mono", "monospace"],
        mono:  ["DM Mono", "monospace"],
        serif: ["DM Serif Display", "serif"],
        lora:  ["Lora", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
