import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { feedbackPlugin } from "./dev/feedback-plugin";

export default defineConfig({
  plugins: [reactRouter(), feedbackPlugin()],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["noook", "noook.tsl"],
  },
});
