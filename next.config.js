/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Termos de Uso e Política de Privacidade: HTML gerado no repo do app
  // (Ninho-expo, scripts/gerar-termos-html.mjs) a partir da mesma fonte que
  // a tela do app mostra, e copiado pra public/legal/. Não edite à mão.
  async rewrites() {
    return [
      { source: '/terms', destination: '/legal/terms.html' },
      { source: '/terms-en', destination: '/legal/terms-en.html' },
      { source: '/privacy', destination: '/legal/privacy.html' },
      { source: '/privacy-en', destination: '/legal/privacy-en.html' },
      { source: '/termos', destination: '/legal/terms.html' },
      { source: '/privacidade', destination: '/legal/privacy.html' },
    ];
  },
};

module.exports = nextConfig;
