import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const ARTMOZI_AUTH = "Basic " + Buffer.from("cheppers:chpdemo").toString("base64");

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/proxy/cinemacity": {
        target: "https://www.cinemacity.hu",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/cinemacity/, ""),
      },
      "/proxy/artmozi-api": {
        target: "https://artmozi.hu",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/artmozi-api/, "/api"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Authorization", ARTMOZI_AUTH);
          });
        },
      },
      "/proxy/corvin-api": {
        target: "https://corvinmozi.hu",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/corvin-api/, "/api"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Authorization", ARTMOZI_AUTH);
          });
        },
      },
      "/proxy/artmozi-page": {
        target: "https://artmozi.hu",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/artmozi-page/, ""),
      },
      "/proxy/corvin-page": {
        target: "https://corvinmozi.hu",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/corvin-page/, ""),
      },
    },
  },
});
