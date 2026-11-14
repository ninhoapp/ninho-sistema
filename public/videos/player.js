/* Player dos vídeos de ajuda do Ninho (/v/<slug>).
 *
 * POR QUE ISTO EXISTE
 * A consultora manda o link pelo WhatsApp e a cliente toca. Ela precisa VER
 * o vídeo ali, sem instalar nada. Os vídeos do Ninho não são arquivo de
 * vídeo: são as telas do app desenhadas em código e uma câmera que se
 * aproxima de cada parte enquanto um dedo toca, como a pessoa faria. Este
 * arquivo é a mesma receita do app (Ninho-expo/src/features/consultora/
 * video/), portada para o navegador.
 *
 * Mexeu numa tela do app? Mexa aqui também — o combinado é que o vídeo
 * mostre o app de hoje, não um desenho parecido.
 *
 * O QUE MANTÉM A QUALIDADE (correções do dono, 13 e 14/11/2026)
 *  - a tela NUNCA é ampliada: o tamanho com a câmera longe é calculado para
 *    que, no zoom máximo, ela chegue no máximo a 1:1. Daí para baixo é
 *    sempre redução, que não borra;
 *  - o aparelho aparece INTEIRO, com moldura, e é ele que cresce no zoom;
 *  - o aparelho é preso ao palco: nunca sobra vão em volta;
 *  - toda troca de tela acontece com a câmera PARADA.
 *
 * Sem dependência nenhuma: um <script defer> e pronto.
 */
(function () {
  "use strict";

  var TELA_W = 390;
  var TELA_H = 844;
  var ARO = 9;
  var TITANIO = 2;
  var MOLDURA = ARO + TITANIO;

  /* ───────────────────────── nomes de exemplo ───────────────────────── */
  // Nada aqui lê dado de verdade: é uma demonstração.
  var CONSULTORA = "Joana Oliveira";
  var PRIM = "Joana";
  var MAE = "Mariana";
  var BEBE = "Lara";
  var CODIGO = "JOANA";
  var LINK = "useninho.com.br/consultoria/joana";
  var MSG =
    "Oi! Eu acompanho a rotina de sono do bebê pelo Ninho. É rapidinho:\n" +
    "1. Baixe o Ninho por este link: https://www." + LINK + "\n" +
    "2. Crie sua conta e cadastre o bebê\n" +
    "3. No final, toque em Aprovar para compartilhar a rotina comigo\n" +
    "Se já tem o Ninho, abra o link e toque em Já tenho o Ninho. Meu código: " + CODIGO;
  var ACEITE_CONSULTORA =
    "Atendo esta família como profissional independente, e todas as orientações que eu der são de minha " +
    "responsabilidade exclusiva. O Ninho não presta aconselhamento de saúde nem supervisiona meu atendimento. " +
    "Uso a rotina do bebê só para atender esta família, sem copiar ou divulgar fora do Ninho. Nas anotações, " +
    "registro só o necessário para o atendimento, sem diagnóstico nem remédio.";
  var ACEITE_CURTO =
    "Li e autorizo " + CONSULTORA + " a ver a rotina de " + BEBE + ", só para leitura, como diz o termo. " +
    "Ela é independente e as orientações dela não substituem o pediatra.";
  var ACEITE_FAMILIA =
    "Autorizo " + CONSULTORA + " a ver, só para leitura: o nome e a data de nascimento de " + BEBE + ", o " +
    "primeiro nome do responsável e de quem fez cada registro, o sono, as mamadas, as fraldas, a comida e se " +
    "temos plano. Ela não vê fotos, momentos nem chat. Se viemos pelo link dela, ela vê quanto a parceria " +
    "rende sobre o nosso plano. Posso remover o acesso quando quiser, e sem plano ela deixa de ver a rotina. " +
    "Ela é independente: todas as orientações que der são responsabilidade exclusiva dela e não substituem o " +
    "pediatra. O Ninho é um app de registro de rotina, não presta aconselhamento de saúde e não responde pelas " +
    "orientações dela.";

  var LOGO = "/videos/logo-ninho.png";
  var FOTO = "/videos/entrada-mae.webp";

  /* ──────────────────────────── ícones ──────────────────────────── */
  var P = {
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    bell: '<path d="M12 3a5.5 5.5 0 0 0-5.5 5.5v3L5 15h14l-1.5-3.5v-3A5.5 5.5 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.8 18a2.2 2.2 0 0 0 4.4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    play: '<path d="M7 4.5 19.5 12 7 19.5z" fill="currentColor"/>',
    pause: '<path d="M7 4.5h3.4v15H7zM13.6 4.5H17v15h-3.4z" fill="currentColor"/>',
    whats: '<path d="M12 2.2A9.6 9.6 0 0 0 3.7 16.6L2.3 21.7l5.3-1.4A9.6 9.6 0 1 0 12 2.2zm5 13.4c-.2.6-1.2 1.2-1.9 1.3-.5.1-1.1.1-1.9-.2a11 11 0 0 1-5.6-4.9c-.5-.9-.5-1.7-.3-2.3.2-.5.7-1.1 1-1.3.3-.2.7-.1.9.3l.8 1.5c.1.3.1.5-.1.7l-.4.5c-.1.2-.2.4 0 .7.4.7 1.6 2 2.7 2.4.3.1.5.1.7-.1l.5-.6c.2-.2.4-.2.7-.1l1.5.8c.3.2.4.5.3.9z" fill="currentColor"/>',
    share: '<path d="M12 15.5V3.8m0 0L8.3 7.5M12 3.8l3.7 3.7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 11.5v7A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5v-7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.6 15.6 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    close: '<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>',
    check: '<path d="M5 12.8 9.6 17.4 19 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    checkdone: '<path d="M2 13.2 6 17.2 13.6 9.6M11 13.2 15 17.2 25 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    send: '<path d="M3 20.5 21.5 12 3 3.5l3.4 7.1L16 12l-9.6 1.4z" fill="currentColor"/>',
    up: '<path d="M6 14.5 12 8.5l6 6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    back: '<path d="M14.5 5 8 12l6.5 7" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    headset: '<path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M3 14.5h2.6a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4.3A1.3 1.3 0 0 1 3 18.7zM21 14.5h-2.6a1 1 0 0 0-1 1V19a1 1 0 0 0 1 1h1.3a1.3 1.3 0 0 0 1.3-1.3z" fill="currentColor"/>',
    desktop: '<rect x="3" y="4.5" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 20h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2" fill="currentColor"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    checkcirc: '<circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M7.8 12.4l3 3 5.4-6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    personadd: '<circle cx="10" cy="8" r="4" fill="currentColor"/><path d="M2.5 20c0-3.6 3.4-5.8 7.5-5.8 1.2 0 2.3.2 3.3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 14v6M15 17h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    apple: '<path d="M16.3 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.5-3.7zM14 5.9c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.7-.9 2.8 1 0 2-.5 2.6-1.3z" fill="currentColor"/>',
    google: '<path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285F4"/><path d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z" fill="#FBBC05"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.4 3-4.1 5.6-4.1z" fill="#EA4335"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 8.5l8 5 8-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    happy: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="15" cy="10" r="1.2" fill="currentColor"/><path d="M8.2 14c1 1.3 2.3 2 3.8 2s2.8-.7 3.8-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    key: '<circle cx="8" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 12h9M18 12v3M15.5 12v2.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    people: '<circle cx="9" cy="9" r="3.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 19c0-3 2.7-4.6 6-4.6S15 16 15 19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16 6.2a3.3 3.3 0 0 1 0 6.3M17.5 14.8c2 .6 3.5 2 3.5 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    seta: '<path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    aviao: '<path d="M21 4 3 11l6.5 2.5L12 20l3-6.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  };

  function ic(nome, tam, cor) {
    return (
      '<svg width="' + tam + '" height="' + tam + '" viewBox="0 0 24 24" aria-hidden="true"' +
      (cor ? ' style="color:' + cor + '"' : "") + ">" + P[nome] + "</svg>"
    );
  }

  function bolinha(letra, cor, tam) {
    return (
      '<div class="bolinha" style="width:' + tam + "px;height:" + tam + "px;background:" + cor +
      ";font-size:" + Math.round(tam * 0.38) + 'px">' + letra + "</div>"
    );
  }

  var ONDA =
    '<svg class="wave" width="390" height="34" viewBox="0 0 390 34"><path d="M0 16 C 100 40, 200 0, 290 16 S 370 26, 390 18 L390 34 L0 34Z" fill="#F5F2FC"/></svg>';

  function head(titulo, sub, sino) {
    return (
      '<div class="hd"><div class="glow"></div>' + ONDA + "</div>" +
      '<div class="hdrow"><div class="lg"><img alt="" src="' + LOGO + '"></div>' +
      '<div class="hdtx"><b>' + titulo + "</b>" + (sub ? "<i>" + sub + "</i>" : "") + "</div>" +
      '<div class="rb">' + ic("bell", 21) + (sino ? '<div class="dot"></div>' : "") + "</div>" +
      '<div class="rb">' + ic("menu", 21) + "</div></div>"
    );
  }

  var BARRA =
    '<div class="barra">' +
    '<div class="r dark">' + ic("headset", 20) + "<span>Ajuda</span></div>" +
    '<div class="mid">' + ic("up", 20) + "</div>" +
    '<div class="r light">' + ic("desktop", 20) + '<span style="font-size:9px">Painel</span>' +
    '<div class="lock">' + ic("lock", 8) + "</div></div></div>";

  function toast(texto) {
    return '<div class="toast">' + ic("checkcirc", 19, "#7FE0A6") + texto + "</div>";
  }

  function caixa(marcado, texto) {
    return (
      '<div class="cx"><div class="bx' + (marcado ? " on" : "") + '">' +
      (marcado ? ic("check", 15) : "") + '</div><div class="t">' + texto + "</div></div>"
    );
  }

  /* ─────────────────────────── as telas ─────────────────────────── */

  var TELAS = {};

  // 1. Convidar família (consultora)
  TELAS.convidar = function () {
    return (
      '<div class="pane on">' +
      head("Convidar família", "Elas compartilham a rotina com você") +
      '<div class="mod" style="top:150px;height:232px"><div class="vcard">' +
      '<div class="vthumb"><div class="pl">' + ic("play", 17) + '</div><div class="dur">0:30</div></div>' +
      '<div class="vmeta"><div class="k">Comece por aqui</div>' +
      '<div class="t">Como convidar uma família</div>' +
      '<div class="c">Em meio minuto: do botão do WhatsApp até você aprovar o pedido dela.</div>' +
      '<div class="b">' + ic("play", 14) + "Assistir</div></div></div></div>" +
      '<div class="mod hl" style="top:392px;height:452px">' +
      '<div class="lrow"><div class="ic">' + ic("moon", 22) + "</div>" +
      '<div><div class="t">Link da consultoria</div><div class="g">Para as suas clientes</div></div></div>' +
      '<div class="linkrow"><div class="u">' + LINK + '</div><div class="pill">Copiar</div></div>' +
      '<div class="hint">Depois do cadastro do bebê, a família aprova ou recusa compartilhar a rotina com ' +
      "você. Se aprovar, você confirma em Famílias. Também gera comissão.</div>" +
      '<div class="bts"><div class="bt lilas">' + ic("whats", 18) + "WhatsApp</div>" +
      '<div class="bt linha">' + ic("share", 18) + "Compartilhar</div></div>" +
      '<div class="warn"><b>Não publique este link.</b> Ele pede para a pessoa compartilhar a rotina do ' +
      "bebê com você.</div>" +
      '<div class="coderow"><div style="flex:1"><div class="k">Código</div><div class="v">' + CODIGO +
      '</div></div><div class="pill" style="background:#F1EBFC;padding:7px 13px;font-size:12px">Copiar</div>' +
      "</div></div>" + BARRA + "</div>"
    );
  };

  // 2. WhatsApp: a lista "Enviar para…" (o botão abre wa.me SEM número)
  TELAS.escolherZap = function () {
    function linha(topo, nome) {
      return (
        '<div class="zline" style="top:' + topo + 'px">' +
        (nome ? bolinha(nome.charAt(0), "#E8607E", 46) : '<div class="av" style="background:#D9D3CC"></div>') +
        '<div class="co">' +
        (nome ? '<div class="nm">' + nome + "</div>" : '<div class="b1"></div>') +
        '<div class="b2"' + (nome ? "" : ' style="width:152px;background:#E8E2DB"') + "></div></div></div>"
      );
    }
    return (
      '<div class="pane on">' +
      '<div class="zhd" style="gap:14px;padding:0 16px 13px">' + ic("close", 23) +
      '<b style="flex:1;font-size:18px;font-weight:700">Enviar para…</b>' + ic("search", 21) + "</div>" +
      '<div class="zpick"><div class="zsearch">' + ic("search", 16) + "Pesquisar</div>" +
      '<div class="zsec">Recentes</div>' + linha(88, MAE) + linha(152) + linha(216) + "</div></div>"
    );
  };

  // 3. WhatsApp: a conversa, com a mensagem já escrita
  TELAS.whatsapp = function (e) {
    return (
      '<div class="pane on">' +
      '<div class="zhd">' + ic("back", 24) + bolinha(MAE.charAt(0), "#E8607E", 38) +
      '<div class="nm"><b>' + MAE + "</b><i>online</i></div></div>" +
      '<div class="zbody">' +
      (e.mandou
        ? '<div class="balao">' + MSG + '<div class="mt">14:32 ' + ic("checkdone", 14, "#53BDEB") + "</div></div>"
        : "") +
      "</div>" +
      '<div class="zcomp">' +
      (e.mandou ? '<div class="fld ph">' + ic("happy", 20) + "Mensagem</div>" : '<div class="fld">' + MSG + "</div>") +
      '<div class="snd">' + ic(e.mandou ? "mic" : "send", e.mandou ? 21 : 19) + "</div></div></div>"
    );
  };

  // 4. Início da consultora
  TELAS.inicioConsultora = function (e) {
    var sub = "Boa tarde, " + PRIM + " · " + (e.confirmado ? "1 família" : "0 famílias");
    var miolo = e.confirmado
      ? '<div class="mod" style="top:150px;height:150px"><div class="ptitle">Suas famílias</div>' +
        '<div style="display:flex;align-items:center;gap:12px;margin-top:16px">' +
        '<div class="ini">' + BEBE.charAt(0) + '</div><div style="flex:1">' +
        '<div class="n" style="font-size:15px">' + BEBE + '</div><div class="w">Mãe: ' + MAE + "</div></div>" +
        '<div class="tag" style="background:#FFF2D6;color:#B7791F">Sem registro</div></div></div>'
      : '<div class="mod" style="top:150px;height:214px"><div style="height:54px">' +
        '<div class="ptitle">Pedidos de famílias</div>' +
        '<div class="phint">Elas pediram para você acompanhar a rotina. O bebê só aparece na sua lista ' +
        "depois que você aprovar.</div></div>" +
        '<div style="margin-top:8px;padding-top:12px">' +
        '<div class="prow"><div class="ini">' + BEBE.charAt(0) + '</div><div style="flex:1">' +
        '<div class="n">' + MAE + " · " + BEBE + '</div><div class="w">Pediu agora</div></div></div>' +
        '<div class="bts" style="margin-top:10px"><div class="bt linha" style="height:40px">Recusar</div>' +
        '<div class="bt lilas" style="height:40px">Aprovar</div></div></div></div>';
    return (
      '<div class="pane on">' + head("Início", sub, !e.confirmado) + miolo + BARRA +
      (e.confirmado ? toast("Pronto. O bebê já aparece na sua lista.") : "") + "</div>"
    );
  };

  // 5. Central de notificações, com o aviso do pedido
  TELAS.avisos = function (e) {
    var lido = e.leuAviso;
    return (
      '<div class="pane on">' + head("Notificações", "", !lido) +
      '<div class="mod" style="top:150px;height:272px;padding:20px 16px 18px">' +
      '<div style="height:34px;display:flex;align-items:center;gap:10px">' +
      '<div style="width:34px;height:34px;border-radius:50%;background:#EDE4FB;display:flex;' +
      'align-items:center;justify-content:center;color:#7C5CD6">' + ic("back", 19) + "</div>" +
      '<div style="flex:1;font-size:17px;font-weight:800;letter-spacing:-.2px">Notificações</div></div>' +
      '<div style="height:26px;margin-top:16px;display:flex;align-items:center;' +
      'justify-content:space-between;margin-left:4px;margin-right:4px">' +
      (lido ? "<span></span>" : '<span style="color:#7C5CD6;font-size:12px;font-weight:600">Marcar todas como lidas</span>') +
      '<span style="color:#7C5CD6;font-size:12px;font-weight:600">Editar</span></div>' +
      '<div style="height:14px;margin-top:12px;margin-left:4px;color:#8D80A8;font-size:11px;' +
      'font-weight:700;letter-spacing:.6px;text-transform:uppercase">Hoje</div>' +
      '<div class="aviso' + (lido ? " lido" : "") + '"><div class="ic">' + ic("personadd", 19) + "</div>" +
      '<div class="co"><div class="t">Novo pedido de família</div>' +
      '<div class="b">' + MAE + " quer que você acompanhe a rotina de " + BEBE + ". Abra para aprovar.</div>" +
      '<div class="bt-aviso">Ver pedido</div></div>' +
      (lido ? "" : '<div class="ponto"></div>') + "</div></div></div>"
    );
  };

  // 6. Pedidos de famílias (para onde o aviso leva)
  TELAS.pedidos = function (e) {
    var alt = e.confirmado ? 110 : e.abrindo ? 372 : 202;
    var corpo = e.confirmado
      ? ""
      : '<div style="margin-top:8px;padding-top:12px">' +
        '<div class="prow"><div class="ini">' + BEBE.charAt(0) + '</div><div style="flex:1">' +
        '<div class="n">' + MAE + " · " + BEBE + '</div><div class="w">Pediu agora</div></div></div>' +
        (e.abrindo
          ? '<div class="aceite">' + caixa(e.aceito, ACEITE_CONSULTORA) + "</div>" +
            '<div class="bts" style="margin-top:10px"><div class="bt suave" style="height:40px">Cancelar</div>' +
            '<div class="bt lilas' + (e.aceito ? "" : " off") +
            '" style="height:40px;flex:1.4">Aprovar e acompanhar</div></div>'
          : '<div class="bts" style="margin-top:10px"><div class="bt linha" style="height:40px">Recusar</div>' +
            '<div class="bt lilas" style="height:40px">Aprovar</div></div>') +
        "</div>";
    return (
      '<div class="pane on">' + head("Pedidos de famílias", "Consultora independente") +
      '<div class="mod" style="top:150px;height:68px">' +
      '<div style="height:32px;display:flex;align-items:center;gap:10px">' +
      '<div style="width:32px;height:32px;border-radius:50%;background:#F3EEFC;display:flex;' +
      'align-items:center;justify-content:center;color:#7C5CD6">' + ic("back", 17) + "</div>" +
      '<div style="flex:1;font-size:16px;font-weight:800">Pedidos de famílias</div></div></div>' +
      '<div class="mod" style="top:230px;height:' + alt + 'px"><div style="height:54px">' +
      '<div class="ptitle">Pedidos de famílias</div><div class="phint">' +
      (e.confirmado
        ? "Nenhum pedido esperando você agora."
        : "Elas pediram para você acompanhar a rotina. O bebê só aparece na sua lista depois que você aprovar.") +
      "</div></div>" + corpo + "</div>" + BARRA +
      (e.confirmado ? toast("Pronto. O bebê já aparece na sua lista.") : "") + "</div>"
    );
  };

  // 7. A página do link da consultoria, no Safari (o que a cliente abre)
  TELAS.paginaLink = function () {
    return (
      '<div class="pane on"><div class="pg">' +
      '<div class="url">' + ic("lock", 11) + "useninho.com.br</div>" +
      '<div class="topo"><div class="marca"><div class="lg"><img alt="" src="' + LOGO + '"></div>' +
      "<b>Ninho</b></div>" +
      '<div class="foto">' + bolinha(PRIM.charAt(0), "#3E9D70", 104) +
      '<div class="selo">' + ic("check", 14) + "</div></div>" +
      "<h2>" + CONSULTORA + '</h2><div class="papel">Consultora de sono</div>' +
      '<div class="chamada">A ' + PRIM + " vai acompanhar a rotina do seu bebê pelo Ninho</div>" +
      '<div class="sub">Baixe o app e cadastre o bebê. No final, confirme que quer compartilhar a rotina ' +
      "com ela. Nada de mandar print.</div></div>" +
      '<div class="acoes"><div class="b1">Baixar o Ninho grátis</div>' +
      '<div class="b2">Já tenho o Ninho</div>' +
      '<div class="pe">7 dias grátis. Código da ' + PRIM + ": <b>" + CODIGO + "</b></div></div></div></div>"
    );
  };

  // 8. Entrada do app (login)
  TELAS.criarConta = function () {
    return (
      '<div class="pane on"><div class="ent"><div class="ceu"></div>' +
      '<div class="mini"><div class="in"><div class="hdm"></div>' +
      '<div style="margin:8px;height:60px;border-radius:14px;background:#fff"></div>' +
      '<div style="margin:0 8px;height:90px;border-radius:14px;background:#fff"></div></div></div>' +
      '<div class="marca"><div class="lg"><img alt="" src="' + LOGO + '"></div><b>Ninho</b></div>' +
      '<div class="folha"><h3>A rotina do bebê,<br><span>leve e em família.</span></h3>' +
      '<div class="s">Sono, mamadas e memórias num lugar só.</div>' +
      '<div class="bs"><div class="be dark">' + ic("apple", 18) + "Continuar com Apple</div>" +
      '<div class="be">' + ic("google", 17) + "Continuar com Google</div>" +
      '<div class="be">' + ic("mail", 18, "#7C5CD6") + "Continuar com e-mail</div></div>" +
      '<div class="links">Novo aqui? <b>Criar conta</b>  ·  <b>Termos</b>  ·  <b>Privacidade</b></div>' +
      "</div></div></div>"
    );
  };

  // 9. Cadastro do bebê
  TELAS.bebe = function (e) {
    return (
      '<div class="pane on"><div class="ob"><div class="halo"></div>' +
      '<img class="foto" alt="" src="' + FOTO + '"><div class="fade"></div>' +
      '<div class="folha"><h3>Oi, ' + MAE + "! Quem vai morar neste Ninho?</h3>" +
      '<div class="conv">' + ic("people", 16) + "Recebeu um convite da família?</div>" +
      '<div style="margin-top:14px"><div class="campo' + (e.focado ? " foco" : "") +
      (e.nome ? " cheio" : "") + '">' + ic("happy", 19, "#9F86E0") +
      '<span style="flex:1">' + (e.nome || "Nome do bebê") + "</span>" +
      (e.focado ? '<span class="cursor"></span>' : "") + "</div></div>" +
      '<div style="height:76px;margin-top:14px"><div class="rot">Nasceu em</div>' +
      '<div class="campo cheio">' + ic("calendar", 19, "#9F86E0") + "<span>12/09/2026</span></div></div>" +
      '<div class="pills"><div class="on">Já nasceu</div><div class="off">Está a caminho</div></div>' +
      '<div class="ind">+ Tenho um código de indicação</div>' +
      '<div class="termos"><div class="bx' + (e.termos ? " on" : "") + '">' +
      (e.termos ? ic("check", 15) : "") + '</div><div class="tx">Li e aceito os <b>Termos de Uso</b> e a ' +
      "<b>Política de Privacidade</b></div></div>" +
      '<div style="margin-top:12px"><div class="bt lilas' +
      (e.termos && e.nome ? "" : " off") + '" style="height:52px">Começar ' + ic("seta", 18) + "</div></div>" +
      "</div></div></div>"
    );
  };

  // 10. A pergunta da consultora, logo depois do cadastro
  TELAS.aprovar = function (e) {
    function item(ok, texto) {
      return "<li>" + ic(ok ? "check" : "close", 17, ok ? "#4CAF74" : "#E85D5D") + "<span>" + texto + "</span></li>";
    }
    return (
      '<div class="pane on"><div class="ap">' +
      '<div class="topo"><div style="position:relative">' + bolinha(PRIM.charAt(0), "#7F5FD6", 88) +
      '<div class="selo">' + ic("check", 15) + "</div></div>" +
      '<div class="k">Você veio pelo link da sua consultora</div>' +
      "<h3>Quer que a " + PRIM + " acompanhe a rotina de " + BEBE + "?</h3></div>" +
      '<div class="card"><div class="quem">' + bolinha(PRIM.charAt(0), "#7F5FD6", 44) +
      "<div><b>" + CONSULTORA + "</b><i>Consultora de sono independente</i></div></div><ul>" +
      item(true, "Vê sono, mamadas, fraldas e comida") +
      item(true, "Só para ler: não muda nada no seu app") +
      item(false, "Não vê fotos, momentos nem chat") +
      item(true, "Você pode tirar o acesso quando quiser") +
      "</ul></div>" +
      '<div class="caixa">' + caixa(e.aceito, ACEITE_CURTO) + '<div class="ler">Ler o termo completo</div></div>' +
      '<div class="acoes"><div class="bt suave" style="height:52px">Recusar</div>' +
      '<div class="bt lilas' + (e.aceito ? "" : " off") + '" style="height:52px;flex:1.6">Aprovar</div></div>' +
      '<div class="pe">Se aprovar, a ' + PRIM + " confirma do lado dela.</div>" +
      (e.aprovado
        ? toast("Pedido enviado. Quando a " + PRIM + " confirmar, ela passa a ver a rotina.")
        : "") +
      "</div></div>"
    );
  };

  // 11. Adicionar consultora (quem já tem conta chega aqui pelo link)
  TELAS.adicionarConsultora = function (e) {
    if (e.aprovado) {
      return (
        '<div class="pane on">' + head("Consultora de sono", "Compartilhe a rotina com quem te ajuda") +
        '<div class="mod" style="top:150px;height:224px"><div class="enviado">' +
        '<div class="ic">' + ic("aviao", 26) + "</div>" +
        '<div class="tx">Pedido enviado. Quando ' + PRIM + " aprovar, ela aparece aqui.</div></div>" +
        '<div style="margin-top:18px"><div class="bt lilas" style="height:50px">Voltar para Cuidadores</div>' +
        "</div></div></div>"
      );
    }
    return (
      '<div class="pane on"><div class="ad' + (e.rolou ? " rolou" : "") + '">' +
      head("Consultora de sono", "Compartilhe a rotina com quem te ajuda") +
      '<div class="mod" style="top:150px;height:268px">' +
      '<div class="volta">' + ic("back", 20) + "<span>Adicionar consultora</span></div>" +
      '<div class="rot">Código da consultora</div>' +
      '<div class="cod">' + ic("key", 18) + "<b>" + CODIGO + "</b></div>" +
      '<div class="hint2">Ela te passa o código ou um link.</div>' +
      '<div class="achada">' + bolinha(PRIM.charAt(0), "#3E9D70", 46) +
      '<div style="flex:1"><b>' + CONSULTORA + '</b><div class="et">Consultora independente</div></div></div>' +
      "</div>" +
      '<div class="termo">' + caixa(e.aceito, ACEITE_FAMILIA) + "</div>" +
      '<div class="fim"><div class="bt lilas' + (e.aceito ? "" : " off") +
      '" style="height:52px">Compartilhar a rotina</div>' +
      '<div class="pe">Você pode tirar ' + PRIM + " quando quiser.</div></div></div></div>"
    );
  };

  /* ───────────── alvos da câmera e dos toques (390×844) ───────────── */
  var A = {
    linkDaConsultoria: { x: 195, y: 490 },
    btnWhats: { x: 110, y: 609 },
    botoesConvidar: { x: 195, y: 609 },
    contatoMae: { x: 195, y: 232 },
    campoZap: { x: 170, y: 735 },
    btnEnviarZap: { x: 357, y: 787 },
    balao: { x: 220, y: 205 },
    pedido: { x: 195, y: 263 },
    sino: { x: 305, y: 85 },
    avisoPedido: { x: 195, y: 342 },
    btnVerPedido: { x: 75, y: 375 },
    voltarPedidos: { x: 46, y: 184 },
    btnAprovarNaTela: { x: 280, y: 394 },
    caixaNaTela: { x: 53, y: 397 },
    btnConfirmarNaTela: { x: 267, y: 564 },
    btnBaixar: { x: 195, y: 676 },
    btnJaTenho: { x: 195, y: 738 },
    btnCriar: { x: 195, y: 598 },
    inpNome: { x: 195, y: 476 },
    caixaTermos: { x: 41, y: 694 },
    btnSalvar: { x: 195, y: 760 },
    caixaTermo: { x: 55, y: 605 },
    btnAprovar: { x: 262, y: 728 },
    consultoraAchada: { x: 195, y: 363 },
    caixaAdicionar: { x: 37, y: 256 },
    btnCompartilhar: { x: 195, y: 655 },
    pedidoEnviado: { x: 195, y: 262 },
  };

  function lim(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  /* ──────────────────────────── roteiros ──────────────────────────── */
  var Z = 1.45;
  var ROTEIROS = {};

  // "Como convidar uma família" — para a consultora (o percurso dela inteiro)
  var V1 = {
    toqueWhats: 4700, telaEscolher: 6100, toqueContato: 7900, telaZap: 9100, toqueEnviar: 11200,
    mandou: 11450, voltaApp: 14800, toqueSino: 16600, telaAvisos: 17700, toqueAviso: 19500,
    leuAviso: 19600, telaPedidos: 20700, toqueAprova: 22400, abrindo: 22600, confirmarCena: 23200,
    toqueCaixa: 24100, toqueConfirma: 25900, confirmado: 26100, toqueVoltar: 27500, telaFim: 28700,
  };
  ROTEIROS.convidar = {
    dur: 30500,
    cenas: [0, V1.telaEscolher, V1.telaZap, V1.voltaApp, V1.telaAvisos, V1.telaPedidos, V1.confirmarCena, V1.telaFim],
    legendas: [
      "Toque em WhatsApp",
      "Escolha a conversa da sua cliente",
      "A mensagem já vai escrita",
      "Volte ao app e abra o sininho",
      "Toque no aviso do pedido",
      "Aprove o pedido que chega",
      "Marque a caixa e aprove",
      "Pronto: a família entra na sua lista",
    ],
    cam: [
      [0, 1, -1, -1], [1300, 1, -1, -1],
      [2000, 1.3, A.linkDaConsultoria.x, A.linkDaConsultoria.y],
      [3300, 1.3, A.linkDaConsultoria.x, A.linkDaConsultoria.y],
      [3900, Z, A.botoesConvidar.x, A.botoesConvidar.y],
      [5400, Z, A.botoesConvidar.x, A.botoesConvidar.y],
      [6100, 1, -1, -1], [6800, 1, -1, -1],
      [7300, 1.35, A.contatoMae.x, A.contatoMae.y], [8600, 1.35, A.contatoMae.x, A.contatoMae.y],
      [9100, 1, -1, -1], [9900, 1, -1, -1],
      [10500, 1.35, A.campoZap.x, A.campoZap.y], [12200, 1.35, A.campoZap.x, A.campoZap.y],
      [12900, 1.3, A.balao.x, A.balao.y], [14200, 1.3, A.balao.x, A.balao.y],
      [14800, 1, -1, -1], [15600, 1, -1, -1],
      [16100, 1.4, A.sino.x, A.sino.y], [17000, 1.4, A.sino.x, A.sino.y],
      [17700, 1, -1, -1], [18400, 1, -1, -1],
      [18900, 1.35, A.avisoPedido.x, A.avisoPedido.y], [20100, 1.35, A.avisoPedido.x, A.avisoPedido.y],
      [20700, 1, -1, -1], [21400, 1, -1, -1],
      [21900, 1.35, A.btnAprovarNaTela.x, A.btnAprovarNaTela.y],
      [23000, 1.35, A.btnAprovarNaTela.x, A.btnAprovarNaTela.y],
      [23600, Z, A.caixaNaTela.x + 110, A.caixaNaTela.y + 40],
      [24900, Z, A.caixaNaTela.x + 110, A.caixaNaTela.y + 40],
      [25400, 1.4, A.btnConfirmarNaTela.x, A.btnConfirmarNaTela.y],
      [26700, 1.4, A.btnConfirmarNaTela.x, A.btnConfirmarNaTela.y],
      [27200, 1.3, A.voltarPedidos.x, A.voltarPedidos.y], [28000, 1.3, A.voltarPedidos.x, A.voltarPedidos.y],
      [28700, 1.15, A.pedido.x, A.pedido.y], [30500, 1.15, A.pedido.x, A.pedido.y],
    ],
    toques: [
      [V1.toqueWhats, A.btnWhats.x, A.btnWhats.y],
      [V1.toqueContato, A.contatoMae.x, A.contatoMae.y],
      [V1.toqueEnviar, A.btnEnviarZap.x, A.btnEnviarZap.y],
      [V1.toqueSino, A.sino.x, A.sino.y],
      [V1.toqueAviso, A.btnVerPedido.x, A.btnVerPedido.y],
      [V1.toqueAprova, A.btnAprovarNaTela.x, A.btnAprovarNaTela.y],
      [V1.toqueCaixa, A.caixaNaTela.x, A.caixaNaTela.y],
      [V1.toqueConfirma, A.btnConfirmarNaTela.x, A.btnConfirmarNaTela.y],
      [V1.toqueVoltar, A.voltarPedidos.x, A.voltarPedidos.y],
    ],
    estadoEm: function (ms) {
      return {
        tela: ms >= V1.telaFim ? "inicioConsultora"
          : ms >= V1.telaPedidos ? "pedidos"
          : ms >= V1.telaAvisos ? "avisos"
          : ms >= V1.voltaApp ? "inicioConsultora"
          : ms >= V1.telaZap ? "whatsapp"
          : ms >= V1.telaEscolher ? "escolherZap" : "convidar",
        mandou: ms >= V1.mandou,
        leuAviso: ms >= V1.leuAviso,
        abrindo: ms >= V1.abrindo,
        aceito: ms >= V1.toqueCaixa + 100,
        confirmado: ms >= V1.confirmado,
      };
    },
  };

  // "Como aprovar a sua consultora" — cliente que vai criar a conta agora
  var V2 = {
    toqueBaixar: 2400, telaEntrada: 3400, toqueApple: 5400, telaBebe: 6400, foco: 6900,
    digitaDe: 7100, digitaAte: 8500, toqueTermos: 9600, toqueSalvar: 11000, telaAprovar: 11800,
    toqueCaixa: 13800, toqueAprovar: 15400, aprovado: 15600,
  };
  ROTEIROS.aprovar = {
    dur: 19000,
    cenas: [0, V2.telaEntrada, V2.telaBebe, V2.telaAprovar],
    legendas: [
      "Abra o link e toque em Baixar o Ninho",
      "Entre com a Apple ou o Google",
      "Marque os Termos e toque em Começar",
      "Toque em Aprovar",
    ],
    cam: [
      [0, 1, -1, -1], [1300, 1, -1, -1],
      [1800, 1.35, A.btnBaixar.x, A.btnBaixar.y], [3000, 1.35, A.btnBaixar.x, A.btnBaixar.y],
      [3400, 1, -1, -1], [4200, 1, -1, -1],
      [4700, 1.35, A.btnCriar.x, A.btnCriar.y], [6000, 1.35, A.btnCriar.x, A.btnCriar.y],
      [6400, 1, -1, -1], [6800, 1, -1, -1],
      [7200, 1.4, A.inpNome.x, A.inpNome.y], [8800, 1.4, A.inpNome.x, A.inpNome.y],
      [9200, 1.4, A.caixaTermos.x + 120, A.caixaTermos.y], [10200, 1.4, A.caixaTermos.x + 120, A.caixaTermos.y],
      [10600, 1.3, A.btnSalvar.x, A.btnSalvar.y], [11400, 1.3, A.btnSalvar.x, A.btnSalvar.y],
      [11800, 1, -1, -1], [12800, 1, -1, -1],
      [13200, 1.4, A.caixaTermo.x + 110, A.caixaTermo.y], [14400, 1.4, A.caixaTermo.x + 110, A.caixaTermo.y],
      [14900, 1.45, A.btnAprovar.x, A.btnAprovar.y], [16000, 1.45, A.btnAprovar.x, A.btnAprovar.y],
      [16400, 1, -1, -1], [19000, 1, -1, -1],
    ],
    toques: [
      [V2.toqueBaixar, A.btnBaixar.x, A.btnBaixar.y],
      [V2.toqueApple, A.btnCriar.x, A.btnCriar.y],
      [V2.toqueTermos, A.caixaTermos.x, A.caixaTermos.y],
      [V2.toqueSalvar, A.btnSalvar.x, A.btnSalvar.y],
      [V2.toqueCaixa, A.caixaTermo.x, A.caixaTermo.y],
      [V2.toqueAprovar, A.btnAprovar.x, A.btnAprovar.y],
    ],
    estadoEm: function (ms) {
      var k = lim((ms - V2.digitaDe) / (V2.digitaAte - V2.digitaDe), 0, 1);
      return {
        tela: ms >= V2.telaAprovar ? "aprovar"
          : ms >= V2.telaBebe ? "bebe"
          : ms >= V2.telaEntrada ? "criarConta" : "paginaLink",
        nome: ms >= V2.digitaDe ? BEBE.slice(0, Math.round(k * BEBE.length)) : "",
        focado: ms >= V2.foco && ms < V2.digitaAte + 300,
        termos: ms >= V2.toqueTermos + 100,
        aceito: ms >= V2.toqueCaixa + 100,
        aprovado: ms >= V2.aprovado,
      };
    },
  };

  // "Como aprovar a sua consultora" — cliente que JÁ tem conta
  var V3 = { toqueJaTenho: 2400, telaAdicionar: 3400, rolou: 6400, toqueCaixa: 8000, toqueCompartilhar: 9600, enviado: 9800 };
  ROTEIROS["ja-tenho-conta"] = {
    dur: 13500,
    cenas: [0, V3.telaAdicionar, V3.rolou],
    legendas: [
      "Abra o link e toque em Já tenho o Ninho",
      "O app abre com a sua consultora",
      "Marque a caixa e toque em Compartilhar",
    ],
    cam: [
      [0, 1, -1, -1], [1300, 1, -1, -1],
      [1800, 1.35, A.btnJaTenho.x, A.btnJaTenho.y], [3000, 1.35, A.btnJaTenho.x, A.btnJaTenho.y],
      [3400, 1, -1, -1], [4200, 1, -1, -1],
      [4700, 1.3, A.consultoraAchada.x, A.consultoraAchada.y],
      [6000, 1.3, A.consultoraAchada.x, A.consultoraAchada.y],
      [6400, 1, -1, -1], [7000, 1, -1, -1],
      [7400, 1.4, A.caixaAdicionar.x + 110, A.caixaAdicionar.y + 40],
      [8600, 1.4, A.caixaAdicionar.x + 110, A.caixaAdicionar.y + 40],
      [9000, 1.35, A.btnCompartilhar.x, A.btnCompartilhar.y],
      [10200, 1.35, A.btnCompartilhar.x, A.btnCompartilhar.y],
      [10600, 1.15, A.pedidoEnviado.x, A.pedidoEnviado.y], [13500, 1.15, A.pedidoEnviado.x, A.pedidoEnviado.y],
    ],
    toques: [
      [V3.toqueJaTenho, A.btnJaTenho.x, A.btnJaTenho.y],
      [V3.toqueCaixa, A.caixaAdicionar.x, A.caixaAdicionar.y],
      [V3.toqueCompartilhar, A.btnCompartilhar.x, A.btnCompartilhar.y],
    ],
    estadoEm: function (ms) {
      return {
        tela: ms >= V3.telaAdicionar ? "adicionarConsultora" : "paginaLink",
        rolou: ms >= V3.rolou,
        aceito: ms >= V3.toqueCaixa + 100,
        aprovado: ms >= V3.enviado,
      };
    },
  };

  /* ──────────────────────────── o motor ──────────────────────────── */

  function suave(k) {
    return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  }
  function entre(a, b, k) {
    return a + (b - a) * k;
  }

  function montar(raiz) {
    var slug = raiz.getAttribute("data-video");
    var roteiro = ROTEIROS[slug];
    if (!roteiro) return;

    raiz.innerHTML =
      '<div class="nv-palco">' +
      '<div class="nv-dev">' +
      '<span class="nv-sb nv-s1"></span><span class="nv-sb nv-s2"></span>' +
      '<span class="nv-sb nv-s3"></span><span class="nv-sb nv-s4"></span>' +
      '<div class="nv-tita"><div class="nv-aro"><div class="nv-glass">' +
      '<div class="nv-scr"></div><div class="nv-island"></div>' +
      "</div></div></div><div class=\"nv-glare\"></div></div>" +
      '<div class="nv-onda"></div><div class="nv-dedo"></div>' +
      '<button class="nv-tap" aria-label="Tocar ou pausar"></button>' +
      "</div>" +
      '<div class="nv-rodape">' +
      '<div class="nv-leg"><span class="n">1</span><span class="t"></span></div>' +
      '<div class="nv-ctl"><button class="nv-play" aria-label="Tocar ou pausar">' + ic("pause", 20) + "</button>" +
      '<div class="nv-prog" role="progressbar" aria-label="Linha do tempo"><i></i></div>' +
      '<span class="nv-tempo">0:00</span></div></div>';

    var q = function (sel) {
      return raiz.querySelector(sel);
    };
    var palco = q(".nv-palco");
    var dev = q(".nv-dev");
    var tita = q(".nv-tita");
    var aro = q(".nv-aro");
    var glass = q(".nv-glass");
    var scr = q(".nv-scr");
    var island = q(".nv-island");
    var glare = q(".nv-glare");
    var dedo = q(".nv-dedo");
    var onda = q(".nv-onda");
    var legN = q(".nv-leg .n");
    var legT = q(".nv-leg .t");
    var fill = q(".nv-prog i");
    var tempoEl = q(".nv-tempo");
    var btnPlay = q(".nv-play");

    var zoomMax = roteiro.cam.reduce(function (m, p) {
      return Math.max(m, p[1]);
    }, 1);

    var palcoW = 0;
    var palcoH = 0;
    var base = 0;

    // O palco acompanha o tamanho do aparelho de quem assiste. O teto de
    // 1/zoomMax é o que impede a tela de ser AMPLIADA no zoom máximo.
    function medir() {
      palcoW = raiz.clientWidth || 390;
      var alturaJanela = window.innerHeight || 700;
      palcoH = Math.round(Math.min(Math.max(alturaJanela * 0.66, 380), 640));
      palco.style.height = palcoH + "px";
      var cabe = Math.min((palcoW - 2 * MOLDURA) / TELA_W, (palcoH - 2 * MOLDURA) / TELA_H, 1);
      base = Math.min(cabe, 1 / zoomMax);
    }

    function cameraEm(ms) {
      var cam = roteiro.cam;
      var i = 0;
      while (i < cam.length - 1 && ms >= cam[i + 1][0]) i += 1;
      var a = cam[i];
      var b = cam[Math.min(i + 1, cam.length - 1)];
      var k = b[0] === a[0] ? 0 : suave(lim((ms - a[0]) / (b[0] - a[0]), 0, 1));
      var ax = a[2] < 0 ? TELA_W / 2 : a[2];
      var ay = a[3] < 0 ? TELA_H / 2 : a[3];
      var bx = b[2] < 0 ? TELA_W / 2 : b[2];
      var by = b[3] < 0 ? TELA_H / 2 : b[3];
      return { z: entre(a[1], b[1], k), x: entre(ax, bx, k), y: entre(ay, by, k) };
    }

    var chaveAnterior = "";

    function pintarConteudo(e) {
      var chave = [e.tela, e.mandou, e.leuAviso, e.abrindo, e.aceito, e.confirmado, e.nome, e.focado, e.termos, e.aprovado, e.rolou].join("|");
      if (chave === chaveAnterior) return;
      chaveAnterior = chave;
      scr.innerHTML = TELAS[e.tela](e);
    }

    function pintar(ms) {
      var c = cameraEm(ms);
      var e = base * c.z;
      var vidroW = TELA_W * e;
      var vidroH = TELA_H * e;
      var devW = vidroW + 2 * MOLDURA;
      var devH = vidroH + 2 * MOLDURA;
      var devX = palcoW / 2 - MOLDURA - c.x * e;
      var devY = palcoH / 2 - MOLDURA - c.y * e;
      devX = devW >= palcoW ? lim(devX, palcoW - devW, 0) : (palcoW - devW) / 2;
      devY = devH >= palcoH ? lim(devY, palcoH - devH, 0) : (palcoH - devH) / 2;

      dev.style.left = devX + "px";
      dev.style.top = devY + "px";
      dev.style.width = devW + "px";
      dev.style.height = devH + "px";
      var rT = 44 * e + MOLDURA + "px";
      tita.style.borderRadius = rT;
      glare.style.borderRadius = rT;
      aro.style.borderRadius = 44 * e + ARO + "px";
      glass.style.width = vidroW + "px";
      glass.style.height = vidroH + "px";
      glass.style.borderRadius = 44 * e + "px";
      scr.style.transform = "scale(" + e + ")";
      island.style.top = 11 * e + "px";
      island.style.left = vidroW / 2 - 60 * e + "px";
      island.style.width = 120 * e + "px";
      island.style.height = 34 * e + "px";
      island.style.borderRadius = 17 * e + "px";

      var toques = roteiro.toques;
      var op = 0;
      var px = 0;
      var py = 0;
      var aperto = 0;
      var ond = -1;
      for (var i = 0; i < toques.length; i += 1) {
        var tq = toques[i];
        var ant = i > 0 ? toques[i - 1] : null;
        var vemDe = ant && tq[0] - ant[0] <= 1600 ? ant : null;
        if (ms >= tq[0] - 700 && ms < tq[0]) {
          var k = suave(lim((ms - (tq[0] - 700)) / 600, 0, 1));
          px = entre(vemDe ? vemDe[1] : tq[1] + 90, tq[1], k);
          py = entre(vemDe ? vemDe[2] : tq[2] + 200, tq[2], k);
          op = vemDe ? 1 : lim((ms - (tq[0] - 700)) / 280, 0, 1);
        } else if (ms >= tq[0] && ms < tq[0] + 500) {
          px = tq[1];
          py = tq[2];
          var prox = i + 1 < toques.length ? toques[i + 1] : null;
          op = prox && prox[0] - tq[0] <= 1600 ? 1 : 1 - lim((ms - tq[0] - 260) / 240, 0, 1);
          aperto = ms < tq[0] + 180 ? 1 : 0;
          ond = (ms - tq[0]) / 500;
        }
      }
      var fx = devX + MOLDURA + px * e - 23;
      var fy = devY + MOLDURA + py * e - 23;
      dedo.style.opacity = op;
      dedo.style.left = fx + "px";
      dedo.style.top = fy + "px";
      dedo.style.transform = "scale(" + (aperto ? 0.82 : 1) + ")";
      onda.style.opacity = ond >= 0 ? (1 - ond) * 0.9 : 0;
      onda.style.left = fx + "px";
      onda.style.top = fy + "px";
      onda.style.transform = "scale(" + (ond >= 0 ? 0.6 + ond * 1.5 : 0.6) + ")";

      pintarConteudo(roteiro.estadoEm(ms));

      var cena = 0;
      while (cena < roteiro.cenas.length - 1 && ms >= roteiro.cenas[cena + 1]) cena += 1;
      legN.textContent = String(cena + 1);
      legT.textContent = roteiro.legendas[cena];
      fill.style.width = (ms / roteiro.dur) * 100 + "%";
      var seg = Math.floor(ms / 1000);
      tempoEl.textContent = "0:" + (seg < 10 ? "0" : "") + seg;
    }

    var reduzir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ms = 0;
    var tocando = !reduzir;
    var ultimo = 0;

    function alternar() {
      tocando = !tocando;
      btnPlay.innerHTML = ic(tocando ? "pause" : "play", 20);
      if (tocando) ultimo = 0;
    }
    btnPlay.addEventListener("click", alternar);
    q(".nv-tap").addEventListener("click", alternar);
    q(".nv-prog").addEventListener("click", function (ev) {
      var r = ev.currentTarget.getBoundingClientRect();
      ms = lim((ev.clientX - r.left) / r.width, 0, 1) * roteiro.dur;
      pintar(ms);
    });
    if (reduzir) btnPlay.innerHTML = ic("play", 20);

    var redimensionar = function () {
      medir();
      pintar(ms);
    };
    window.addEventListener("resize", redimensionar);
    window.addEventListener("orientationchange", redimensionar);

    // Fora da tela o relógio para: nada de animar o que ninguém vê.
    var visivel = true;
    if (window.IntersectionObserver) {
      new window.IntersectionObserver(function (entradas) {
        visivel = entradas[0].isIntersecting;
        if (visivel) ultimo = 0;
      }).observe(raiz);
    }

    function quadro(agora) {
      if (!ultimo) ultimo = agora;
      var dt = agora - ultimo;
      ultimo = agora;
      if (tocando && visivel && !document.hidden) ms = (ms + dt) % roteiro.dur;
      pintar(ms);
      window.requestAnimationFrame(quadro);
    }

    medir();
    pintar(ms);
    window.requestAnimationFrame(quadro);
  }

  function iniciar() {
    var nos = document.querySelectorAll("[data-video]");
    for (var i = 0; i < nos.length; i += 1) montar(nos[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
