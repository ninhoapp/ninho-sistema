/**
 * Esqueleto mostrado enquanto a tela do painel busca dados. Sem isto, clicar
 * no menu deixava a página anterior parada na tela até o servidor terminar —
 * parecia que o clique não tinha pegado.
 */
export default function Carregando() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="mb-6">
        <div className="h-7 w-48 rounded-lg bg-ninho-borda" />
        <div className="mt-2 h-4 w-80 max-w-full rounded bg-ninho-borda/70" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-white" />
    </div>
  );
}
