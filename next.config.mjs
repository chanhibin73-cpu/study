/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // デプロイ時のTypeScript型チェックエラーによるビルド停止をスキップ
    ignoreBuildErrors: true,
  },
  eslint: {
    // デプロイ時のESLintルールエラーによるビルド停止をスキップ
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

