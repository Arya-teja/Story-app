import { defineConfig } from "vite";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "src", "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [
    VitePWA({
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw.js",
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: {
        name: "Story App - Share Your Stories",
        short_name: "Story App",
        description:
          "Share your stories with the world and explore stories from others",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        id: "/#/",
        icons: [
          {
            src: "/images/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/images/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/images/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/images/screenshot-desktop.png",
            sizes: "1920x1080",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "/images/screenshot-mobile.png",
            sizes: "375x812",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
        shortcuts: [
          {
            name: "Add Story",
            short_name: "Add",
            description: "Create a new story",
            url: "/?source=pwa#/add-story",
            icons: [
              {
                src: "/images/logo.png",
                type: "image/png",
                sizes: "192x192",
              },
            ],
          },
          {
            name: "Favorites",
            short_name: "Favorites",
            description: "View your favorite stories",
            url: "/?source=pwa#/favorites",
            icons: [
              {
                src: "/images/logo.png",
                type: "image/png",
                sizes: "192x192",
              },
            ],
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg}"],
      },
      devOptions: {
        enabled: true, // Enable PWA di development
        type: "module",
      },
    }),
  ],
});
