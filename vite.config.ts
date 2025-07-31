import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { nodePolyfills } from "@bangjelkoski/vite-plugin-node-polyfills";

// 获取仓库名称以设置基本路径
const repoName = "injective-dex-app";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills({ protocolImports: true })],
  // 添加GitHub Pages的基本路径 - 始终使用仓库名称作为前缀
  base: `/${repoName}/`,
});
