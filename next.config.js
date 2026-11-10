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
  // "Seja parceiro" mudou de /parceiros para /sejaparceiro (09/11/2026, pedido
  // do dono). Links antigos já enviados continuam funcionando.
  // Cabeçalhos de segurança (auditoria, 10/11/2026). Nada muda na tela.
  //  - nosniff: o navegador não "adivinha" o tipo de um arquivo.
  //  - /admin: não abre dentro de outra página (golpe do clique escondido),
  //    não manda o endereço do painel para outros sites e não entra em buscador.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/parceiros', destination: '/sejaparceiro', permanent: true },
      { source: '/parceiros/guia', destination: '/sejaparceiro/guia', permanent: true },
    ];
  },
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
