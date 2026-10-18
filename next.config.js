/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Voltar a uma tela do painel aberta há menos de 30s não vai de novo ao
  // servidor (o padrão do Next 14.2 para telas dinâmicas é 0s). Ações que
  // gravam chamam revalidatePath/revalidateTag, que limpam esse cache.
  experimental: {
    staleTimes: { dynamic: 30 },
  },
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
