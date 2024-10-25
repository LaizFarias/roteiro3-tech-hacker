async function updateDomainList() {
  // Enviando a mensagem para o background.js
  browser.runtime.sendMessage({ action: 'getData' }).then((response) => {
    // Verificando a resposta recebida do background.js
    console.log('Resposta recebida do background.js:', response);

    // Atualizando a contagem e a lista de domínios de terceiros
    let domainList = document.getElementById('listaDominios');
    domainList.innerHTML = '';

    if (response && response.domains && response.domains.length > 0) {
      console.log('Domínios de terceiros recebidos:', response.domains);
      document.getElementById('contagemDominios').textContent = response.domains.length;

      response.domains.forEach((domain) => {
        let li = document.createElement('li');
        li.textContent = domain;
        domainList.appendChild(li);
      });
    } else {
      let li = document.createElement('li');
      li.textContent = 'Nenhum domínio de terceira parte detectado.';
      domainList.appendChild(li);
    }

    // Atualizando a contagem de armazenamento local detectado
    let localStorageData = response.localStorageData;
    console.log('Armazenamento Local recebido:', localStorageData);

    let storageCount = 0;
    for (let pageUrl in localStorageData) {
      let storage = localStorageData[pageUrl];
      storageCount += Object.keys(storage).length;
    }
    document.getElementById('contagemArmazenamento').textContent = storageCount;

    let localStorageDetails = document.getElementById('detalhesArmazenamentoLocal');
    localStorageDetails.innerHTML = '';  // Limpar os detalhes anteriores

    for (let pageUrl in localStorageData) {
      let pageDiv = document.createElement('div');
      let pageTitle = document.createElement('h3');
      pageTitle.textContent = `Página: ${pageUrl}`;
      pageDiv.appendChild(pageTitle);

      let storage = localStorageData[pageUrl];
      let ul = document.createElement('ul');

      for (let key in storage) {
        let li = document.createElement('li');
        let keySpan = document.createElement('span');
        keySpan.className = 'storage-key';
        keySpan.textContent = key;

        let valueSpan = document.createElement('span');
        valueSpan.className = 'storage-value';
        valueSpan.textContent = `: ${storage[key]}`;

        li.appendChild(keySpan);
        li.appendChild(valueSpan);
        ul.appendChild(li);
      }

      pageDiv.appendChild(ul);
      localStorageDetails.appendChild(pageDiv);
    }

    // Atualizando a contagem de cookies detectados
    let cookiesData = response.cookiesData;
    console.log('Cookies recebidos:', cookiesData);

    let totalCookies = 0;
    for (let url in cookiesData) {
      totalCookies += cookiesData[url].length;
    }
    document.getElementById('contagemCookies').textContent = totalCookies;

    let cookiesDetails = document.getElementById('detalhesCookies');
    cookiesDetails.innerHTML = '';  // Limpar os detalhes anteriores

    for (let url in cookiesData) {
      let pageDiv = document.createElement('div');
      let pageTitle = document.createElement('h3');
      pageTitle.textContent = `URL: ${url}`;
      pageDiv.appendChild(pageTitle);

      let ul = document.createElement('ul');

      cookiesData[url].forEach((cookie) => {
        let li = document.createElement('li');
        li.textContent = `${cookie.name}=${cookie.value}`;
        let info = document.createElement('div');
        info.className = 'cookie-info';
        info.textContent = `Domínio: ${cookie.domain}, Caminho: ${cookie.path}, ` +
          `Parte: ${cookie.isThirdParty ? 'Terceira' : 'Primeira'}, ` +
          `Tipo: ${cookie.isSession ? 'Sessão' : 'Persistente'}`;
        li.appendChild(info);
        ul.appendChild(li);
      });

      pageDiv.appendChild(ul);
      cookiesDetails.appendChild(pageDiv);
    }

  }).catch((error) => {
    console.error('Erro ao receber dados do background.js:', error);
  });
}

// Adicionando o evento para carregar a lista de domínios de terceiros quando o popup for aberto
document.addEventListener('DOMContentLoaded', updateDomainList);
