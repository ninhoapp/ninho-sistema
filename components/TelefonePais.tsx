/**
 * Campo de WhatsApp com seletor de país (bandeira, nome e DDI). HTML puro:
 * funciona em Server Component e sem JavaScript. O servidor junta os dois
 * campos com `juntarTelefone(fd.get(`${name}_pais`), fd.get(name))`.
 */
import { PAISES, separarTelefone } from '@/lib/telefone';

export function TelefonePais({
  name,
  valor,
  classeSelect,
  classeInput,
  id,
  placeholder = 'DDD e número',
}: {
  name: string;
  /** Dígitos já guardados (com DDI), para preencher. */
  valor?: string | null;
  classeSelect?: string;
  classeInput?: string;
  id?: string;
  placeholder?: string;
}) {
  const atual = separarTelefone(valor);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <select name={`${name}_pais`} defaultValue={atual.iso} aria-label="País do WhatsApp" className={classeSelect} style={{ maxWidth: 150 }}>
        {PAISES.map((p) => (
          <option key={p.iso} value={p.iso}>
            {p.bandeira} {p.nome} +{p.ddi}
          </option>
        ))}
      </select>
      <input id={id} name={name} defaultValue={atual.numero} inputMode="tel" autoComplete="tel-national" placeholder={placeholder} className={classeInput} style={{ flex: 1, minWidth: 0 }} />
    </div>
  );
}
