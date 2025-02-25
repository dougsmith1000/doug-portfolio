import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    // experimental: {
    //   websocket: true,
    // },
    preset: "cloudflare-pages",

    rollupConfig: {
      external: ["node:async_hooks"],
    },
  },
});
// .addRouter({
//   name: "ws",
//   type: "http",
//   handler: "./src/ws.ts",
//   target: "server",
//   base: "/ws",
// });
