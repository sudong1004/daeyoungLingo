import type { NextConfig } from "next";

// 모든 화면이 쿠키(비밀번호 입장)와 DB를 읽는 개인용 앱이라
// cacheComponents / partialPrefetching 은 사용하지 않고 기본(동적) 렌더링으로 둡니다.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
