export default {
  src: ["./src/**/*.{js,ts,jsx,tsx}"],
  plugins: [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread"
  ],
  extends: ["airbnb", "airbnb/hooks", "prettier"],
  rules: {
    "react/jsx-filename-extension": ["error", { extensions: [".js", ".jsx", ".ts", ".tsx"] }],
    "react/prop-types": "off",
    "no-console": ["warn", { allow: ["error", "warn"] }],
    "import/prefer-default-export": "off"
  }
}