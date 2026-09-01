import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#F6F4EE",       // warm paper — the page background
        surface: "#FFFFFF",     // card/row surfaces
        ink: "#191712",         // near-black text, warm not blue-black
        line: "#E4DECD",        // hairline borders
        plum: "#3E2A5C",        // primary brand accent (buttons, links, active states)
        "plum-deep": "#2C1D43",
        gold: "#C68A28",        // rank/medal accent
        "gold-soft": "#F4E3BE",
        forest: "#28603F",      // verified / positive
        "forest-soft": "#DCEBE0",
        coral: "#B84A3A",       // downvote / negative
        "coral-soft": "#F3DAD3",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(25,23,18,0.04), 0 8px 24px -12px rgba(25,23,18,0.12)",
        lift: "0 4px 8px rgba(25,23,18,0.06), 0 16px 32px -16px rgba(25,23,18,0.18)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "22px",
      },
    },
  },
  plugins: [],
};
export default config;
