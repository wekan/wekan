const JSZip = require('jszip');

window.ExportHtml = Popup => {
  const saveAs = function(blob, filename) {
    const dl = document.createElement('a');
    dl.href = window.URL.createObjectURL(blob);
    dl.onclick = event => document.body.removeChild(event.target);
    dl.style.display = 'none';
    dl.target = '_blank';
    dl.download = filename;
    document.body.appendChild(dl);
    dl.click();
  };

  const asyncForEach = async function(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  };

  const getPageHtmlString = () => {
    return `<!doctype html>${window.document.querySelector('html').outerHTML}`;
  };

  const removeAnchors = htmlString => {
    const replaceOpenAnchor = htmlString.replace(
      new RegExp('<a ', 'gim'),
      '<span ',
    );
    return replaceOpenAnchor.replace(new RegExp('</a', 'gim'), '</span');
  };

  const ensureSidebarRemoved = () => {
    document.querySelector('.board-sidebar.sidebar').remove();
  };

  const addJsonExportToZip = async (zip, boardSlug) => {
    const downloadJSONLink = document.querySelector('.download-json-link');
    const downloadJSONURL = downloadJSONLink.href;
    const response = await fetch(downloadJSONURL);
    const responseBody = await response.text();
    zip.file(`data/${boardSlug}.json`, responseBody);
  };

  const closeSidebar = () => {
    document.querySelector('.board-header-btn.js-toggle-sidebar').click();
  };

  const cleanBoardHtml = () => {
    Array.from(document.querySelectorAll('script')).forEach(elem =>
      elem.remove(),
    );
    Array.from(
      document.querySelectorAll('link:not([rel="stylesheet"])'),
    ).forEach(elem => elem.remove());
    document.querySelector('#header-quick-access').remove();
    Array.from(
      document.querySelectorAll('#header-main-bar .board-header-btns'),
    ).forEach(elem => elem.remove());
    Array.from(document.querySelectorAll('.list-composer')).forEach(elem =>
      elem.remove(),
    );
    Array.from(
      document.querySelectorAll(
        '.list-composer,.js-card-composer, .js-add-card',
      ),
    ).forEach(elem => elem.remove());
    Array.from(
      document.querySelectorAll('.js-perfect-scrollbar > div:nth-of-type(n+2)'),
    ).forEach(elem => elem.remove());
    Array.from(document.querySelectorAll('.js-perfect-scrollbar')).forEach(
      elem => {
        elem.style = 'overflow-y: auto !important;';
        elem.classList.remove('js-perfect-scrollbar');
      },
    );
    Array.from(document.querySelectorAll('[href]:not(link)')).forEach(elem =>
      elem.attributes.removeNamedItem('href'),
    );
    Array.from(document.querySelectorAll('[href]')).forEach(elem => {
      // eslint-disable-next-line no-self-assign
      elem.href = elem.href;
      // eslint-disable-next-line no-self-assign
      elem.src = elem.src;
    });
    Array.from(document.querySelectorAll('.is-editable')).forEach(elem => {
      elem.classList.remove('is-editable');
    });
  };

  const getBoardSlug = () => {
    return window.location.href.split('/').pop();
  };

  const getStylesheetList = () => {
    return Array.from(
      document.querySelectorAll('link[href][rel="stylesheet"]'),
    );
  };

  const downloadStylesheets = async (stylesheets, zip) => {
    await asyncForEach(stylesheets, async elem => {
      const response = await fetch(elem.href);
      const responseBody = await response.text();

      const finalResponse = responseBody.replace(
        new RegExp('packages/[^/]+/upstream/', 'gim'),
        '../',
      );

      const filename = elem.href
        .split('/')
        .pop()
        .split('?')
        .shift();
      const fileFullPath = `style/${filename}`;
      zip.file(fileFullPath, finalResponse);
      elem.href = `../${fileFullPath}`;
    });
  };

  const getSrcAttached = () => {
    return Array.from(document.querySelectorAll('[src]'));
  };

  const downloadSrcAttached = async (elements, zip, boardSlug) => {
    await asyncForEach(elements, async elem => {
      const response = await fetch(elem.src);
      const responseBody = await response.blob();
      const filename = elem.src
        .split('/')
        .pop()
        .split('?')
        .shift();
      const fileFullPath = `${boardSlug}/${elem.tagName.toLowerCase()}/${filename}`;
      zip.file(fileFullPath, responseBody);
      elem.src = `./${elem.tagName.toLowerCase()}/${filename}`;
    });
  };

  const removeCssUrlSurround = url => {
    const working = url || '';
    return working
      .split('url(')
      .join('')
      .split('")')
      .join('')
      .split('"')
      .join('')
      .split("')")
      .join('')
      .split("'")
      .join('')
      .split(')')
      .join('');
  };

  const getCardCovers = () => {
    return Array.from(document.querySelectorAll('.minicard-cover')).filter(
      elem => elem.style['background-image'],
    );
  };

  const downloadCardCovers = async (elements, zip, boardSlug) => {
    await asyncForEach(elements, async elem => {
      const response = await fetch(
        removeCssUrlSurround(elem.style['background-image']),
      );
      const responseBody = await response.blob();
      const filename = removeCssUrlSurround(elem.style['background-image'])
        .split('/')
        .pop()
        .split('?')
        .shift()
        .split('#')
        .shift();
      const fileFullPath = `${boardSlug}/covers/${filename}`;
      zip.file(fileFullPath, responseBody);
      elem.style = "background-image: url('" + `covers/${filename}` + "')";
    });
  };

  const addBoardHTMLToZip = (boardSlug, zip) => {
    ensureSidebarRemoved();
    const htmlOutputPath = `${boardSlug}/index.html`;
    zip.file(
      htmlOutputPath,
      new Blob([removeAnchors(getPageHtmlString())], {
        type: 'application/html',
      }),
    );
  };

  return async () => {
    const zip = new JSZip();
    const boardSlug = getBoardSlug();

    await addJsonExportToZip(zip, boardSlug);
    Popup.close();
    closeSidebar();
    cleanBoardHtml();

    await downloadStylesheets(getStylesheetList(), zip);
    await downloadSrcAttached(getSrcAttached(), zip, boardSlug);
    await downloadCardCovers(getCardCovers(), zip, boardSlug);

    addBoardHTMLToZip(boardSlug, zip);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${boardSlug}.zip`);
    window.location.reload();
  };
};
