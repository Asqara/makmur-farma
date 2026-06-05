import nextPlugin from "eslint-config-next";

const config = [
  ...nextPlugin,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "drizzle/**"],
  },
];

export default config;
