import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#F3F5FC",        // soft indigo-tinted page background
        surface: "#FFFFFF",     // card/row surfaces
        ink: "#0F1729",         // near-black text, cool not warm
        line: "#E4E8F3",        // hairline borders
        plum: "#4F46E5",        // primary brand accent — indigo/blue-purple (buttons, links, active states)
        "plum-deep": "#3730A3",
        gold: "#F59E0B",        // rank/medal + rating-star accent
        "gold-soft": "#FEF3C7",
        forest: "#0EA5A4",      // verified / positive / upvote (teal)
        "forest-soft": "#CCFBF1",
        coral: "#7C3AED",       // secondary accent — purple (gradients, video/creative icons)
        "coral-soft": "#EDE4FB",
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
