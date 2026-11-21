// ESLint do Ninho-sistema. O Next 16 tirou o `next lint`; agora é `npm run lint`.
//
// As regras novas do React Compiler (react-hooks 7: purity, static-components,
// set-state-in-effect, refs, immutability) ficam como AVISO: o projeto não usa
// o React Compiler, e o código que elas apontam já funcionava no Next 14 (ex.:
// Date.now() em tela do servidor com force-dynamic). Arrumar aos poucos.
// Aspas em texto (no-unescaped-entities) ficam desligadas: o React já escapa.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'next-env.d.ts',
    'public/**',
    'scripts/**',
    '*.config.js',
  ]),
]);
