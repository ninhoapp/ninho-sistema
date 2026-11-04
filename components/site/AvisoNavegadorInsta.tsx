'use client';

/**
 * Dentro do navegador do Instagram/Facebook, a loja às vezes não abre.
 * Mostra uma faixa ensinando a abrir no Safari/Chrome. (Mesmo aviso que a
 * landing antiga tinha.)
 */
import { useEffect, useState } from 'react';

export function AvisoNavegadorInsta() {
  const [plataforma, setPlataforma] = useState<'ios' | 'android' | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/Instagram|FBAN|FBAV|FB_IAB/i.test(ua)) {
      setPlataforma(/iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'android');
    }
  }, []);

  if (!plataforma) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#6D4BD8', color: '#fff', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, fontSize: 14, lineHeight: 1.4,
      }}
    >
      <span>
        Para baixar o app, toque em <strong>⋮</strong> e escolha{' '}
        <strong>{plataforma === 'ios' ? '"Abrir no Safari"' : '"Abrir no Chrome"'}</strong>
      </span>
      <button
        type="button"
        onClick={() => setPlataforma(null)}
        aria-label="Fechar"
        style={{
          flexShrink: 0, background: 'rgba(255,255,255,.2)', border: 0, color: '#fff',
          borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 15,
        }}
      >
        ✕
      </button>
    </div>
  );
}
