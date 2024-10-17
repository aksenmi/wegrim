/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Strict Mode 활성화

  async redirects() {
    return [
      {
        source: "/",
        destination: "/logIn",
        permanent: false, // 영구 리다이렉트 여부 (개발 단계에서는 false 권장)
      },
    ];
  },
};

export default nextConfig;
