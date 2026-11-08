// @ts-check
import { defineConfig } from "astro/config";

// GitHub Pages 주소: https://seongbom123.github.io/todaymoney
// 나중에 자체 도메인을 연결하면 site를 바꾸고 base를 "/"로 바꾸면 됩니다.
export default defineConfig({
  site: "https://seongbom123.github.io",
  base: "/todaymoney",
  trailingSlash: "always",
});
