let dominiosTerceiraParte = {};
let dadosArmazenamentoLocal = {};
let dadosDeCookies = {};
let etiquetasETag = {};

function obterDominio(url) {
  let elemento = document.createElement('a');
  elemento.href = url;
  return elemento.hostname;
}

function verificarCookieTerceiraParte(urlPagina, dominioCookie) {
  let dominioPagina = obterDominio(urlPagina);

  if (dominioCookie) {
    if (dominioCookie.startsWith('.')) {
      dominioCookie = dominioCookie.substring(1);
    }
  } else {
    dominioCookie = dominioPagina;
  }

  return dominioPagina !== dominioCookie && !dominioPagina.endsWith('.' + dominioCookie) && !dominioCookie.endsWith('.' + dominioPagina);
}

browser.webRequest.onHeadersReceived.addListener(
  function(detalhes) {
    let cabecalhosSetCookie = detalhes.responseHeaders.filter(header => header.name.toLowerCase() === 'set-cookie');
    
    if (cabecalhosSetCookie.length > 0) {
      if (!dadosDeCookies[detalhes.url]) {
        dadosDeCookies[detalhes.url] = [];
      }
      cabecalhosSetCookie.forEach(header => {
        let cookie = analisarCabecalhoSetCookie(header.value);
        let ehTerceiraParte = verificarCookieTerceiraParte(detalhes.initiator || detalhes.documentUrl, cookie.domain);
        let ehSessao = !cookie.expires && !cookie['max-age'];
        dadosDeCookies[detalhes.url].push({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain || obterDominio(detalhes.url),
          path: cookie.path,
          isThirdParty: ehTerceiraParte,
          isSession: ehSessao
        });
      });
    }

    let eTagHeader = detalhes.responseHeaders.find(header => header.name.toLowerCase() === 'etag');
    if (eTagHeader) {
      etiquetasETag[detalhes.url] = eTagHeader.value;
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

function analisarCabecalhoSetCookie(valorCabecalho) {
  let partes = valorCabecalho.split(';');
  let parteCookie = partes.shift();
  let [nome, valor] = parteCookie.split('=');
  let cookie = { name: nome.trim(), value: valor.trim() };

  partes.forEach(part => {
    let [chave, val] = part.split('=');
    chave = chave.trim().toLowerCase();
    if (val) val = val.trim();
    cookie[chave] = val || true;
  });

  return cookie;
}

browser.webRequest.onBeforeRequest.addListener(
  function(detalhes) {
    if (detalhes.type === "main_frame") {
      dominiosTerceiraParte = {};
      dadosArmazenamentoLocal = {};
      dadosDeCookies = {};
      etiquetasETag = {};
      return;
    }

    let iniciador = detalhes.initiator || detalhes.documentUrl;
    if (!iniciador) return;

    let dominioPagina = obterDominio(iniciador);
    let dominioRequisicao = obterDominio(detalhes.url);

    // Adicione logs para verificar se os domínios estão sendo capturados corretamente
    console.log('Domínio da página:', dominioPagina);
    console.log('Domínio da requisição:', dominioRequisicao);

    if (dominioPagina !== dominioRequisicao) {
      dominiosTerceiraParte[dominioRequisicao] = true;
      console.log('Domínio de terceira parte detectado:', dominioRequisicao);
    }
  },
  { urls: ["<all_urls>"] }
);

browser.runtime.onMessage.addListener(function(requisicao, remetente, enviarResposta) {
  if (requisicao.action === "getData") {
    enviarResposta({
      domains: Object.keys(dominiosTerceiraParte),
      localStorageData: dadosArmazenamentoLocal,
      cookiesData: dadosDeCookies,
      eTags: etiquetasETag
    });
    console.log('Enviando dados ao popup:', {
      domains: Object.keys(dominiosTerceiraParte),
      localStorageData: dadosArmazenamentoLocal,
      cookiesData: dadosDeCookies,
      eTags: etiquetasETag
    });
  } else if (requisicao.action === "storeLocalStorageData") {
    dadosArmazenamentoLocal[requisicao.data.url] = requisicao.data.storage;
    console.log('Dados do localStorage armazenados:', dadosArmazenamentoLocal);
  } else if (requisicao.action === "storeDocumentCookies") {
    if (!dadosDeCookies[requisicao.data.url]) {
      dadosDeCookies[requisicao.data.url] = [];
    }
    dadosDeCookies[requisicao.data.url].push(...requisicao.data.cookies);
    console.log('Cookies armazenados:', dadosDeCookies[requisicao.data.url]);
  }
});
