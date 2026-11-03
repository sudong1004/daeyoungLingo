import type { MetadataRoute } from "next";

// 폰 브라우저의 "홈 화면에 추가"로 앱처럼 쓰기 위한 설정
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "영어 단어장",
    short_name: "단어장",
    description: "회화 초보를 위한 개인용 영어 단어 학습 앱",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#4f46e5",
    lang: "ko",
  };
}
