'use client';

/**
 * Campo de senha nova com a lista dos critérios de senha forte marcando ✓ ou
 * ✗ enquanto a pessoa digita (regra em lib/auth/senha-forte.ts, que o servidor
 * confere de novo). `opcional` = campo que pode ficar em branco (o painel gera
 * uma senha forte): a lista só aparece quando a pessoa começa a digitar.
 */
import { useState } from 'react';
import { PasswordInput } from '@/components/admin/PasswordInput';
import { criteriosSenha } from '@/lib/auth/senha-forte';

export function SenhaForteInput({
  name,
  placeholder,
  pessoais = [],
  opcional = false,
}: {
  name: string;
  placeholder: string;
  pessoais?: (string | null | undefined)[];
  opcional?: boolean;
}) {
  const [valor, setValor] = useState('');
  const lista = criteriosSenha(valor, pessoais);
  const mostrar = !opcional || valor.length > 0;
  return (
    <div>
      <PasswordInput name={name} placeholder={placeholder} autoComplete="new-password" onChange={setValor} />
      {mostrar && (
        <ul className="mt-2 space-y-1 text-[12px]">
          {lista.map((c) => (
            <li key={c.id} className={`flex items-start gap-1.5 ${c.ok ? 'text-[#2F8A55]' : 'text-ninho-cinza'}`}>
              <span className="w-3 shrink-0 font-black">{c.ok ? '✓' : '•'}</span>
              <span>{c.texto}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
