import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: 仓库名若为 olist-ecommerce-analytics，把 base 改成 '/olist-ecommerce-analytics/'
export default defineConfig({
  plugins: [react()],
  base: "./",
});
