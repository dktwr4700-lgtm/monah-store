import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["5173-ixtsdayu0w34tzltnsc9p-a3d12358.sg1.manus.computer"],
  },
});
