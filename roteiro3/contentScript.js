(function() {
  let dadosArmazenamentoLocal = {};
  let cookiesDoDocumento = [];

  // Captura o localStorage
  for (let i = 0; i < localStorage.length; i++) {
    let chave = localStorage.key(i);
    dadosArmazenamentoLocal[chave] = localStorage.getItem(chave);
  }

  // Captura os cookies definidos via JavaScript
  if (document.cookie) {
    cookiesDoDocumento = document.cookie.split(';').map(cookie => {
      let [name, value] = cookie.split('=');
      return {
        name: name.trim(),
        value: value ? value.trim() : '',
        domain: window.location.hostname,
        path: '/',
        isThirdParty: false,
        isSession: true
      };
    });
  }

  // Envia os dados para o background script
  browser.runtime.sendMessage({
    action: "storeLocalStorageData",
    data: {
      url: window.location.href,
      storage: dadosArmazenamentoLocal
    }
  });

  browser.runtime.sendMessage({
    action: "storeDocumentCookies",
    data: {
      url: window.location.href,
      cookies: cookiesDoDocumento
    }
  });
})();
