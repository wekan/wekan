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

  const getPageHtmlString = (clonedElement = null) => {
    const element = clonedElement || window.document.querySelector('html');
    return `<!doctype html>${element.outerHTML}`;
  };

  const removeAnchors = htmlString => {
    const replaceOpenAnchor = htmlString.replace(
      new RegExp('<a ', 'gim'),
      '<span ',
    );
    return replaceOpenAnchor.replace(new RegExp('</a', 'gim'), '</span');
  };

  const ensureSidebarRemoved = (element = null) => {
    const target = element || document;
    const sidebar = target.querySelector('.board-sidebar.sidebar');
    if (sidebar) {
      sidebar.remove();
    }
  };

  const cleanBoardHtmlClone = (clonedElement) => {
    // Work on cloned element only, not live DOM
    Array.from(clonedElement.querySelectorAll('script')).forEach(elem =>
      elem.remove(),
    );
    Array.from(
      clonedElement.querySelectorAll('link:not([rel="stylesheet"])'),
    ).forEach(elem => elem.remove());

    const headerQuickAccess = clonedElement.querySelector('#header-quick-access');
    if (headerQuickAccess) headerQuickAccess.remove();

    Array.from(
      clonedElement.querySelectorAll('#header-main-bar .board-header-btns'),
    ).forEach(elem => elem.remove());
    Array.from(
      clonedElement.querySelectorAll('.js-pop-over, .pop-over'),
    ).forEach(elem => elem.remove());
    Array.from(clonedElement.querySelectorAll('.list-composer')).forEach(elem =>
      elem.remove(),
    );
    Array.from(
      clonedElement.querySelectorAll(
        '.list-composer,.js-card-composer, .js-add-card',
      ),
    ).forEach(elem => elem.remove());

    // Remove edit/action buttons from cards but keep card content
    Array.from(clonedElement.querySelectorAll('.js-edit, .js-delete, .js-open-card')).forEach(elem =>
      elem.remove(),
    );

    // Keep card details structure for viewing - don't remove or hide
    // The interactive script will handle showing/hiding them

    Array.from(clonedElement.querySelectorAll('[href]:not(link)')).forEach(elem =>
      elem.attributes.removeNamedItem('href'),
    );
    Array.from(clonedElement.querySelectorAll('[href]')).forEach(elem => {
      // eslint-disable-next-line no-self-assign
      elem.href = elem.href;
      // eslint-disable-next-line no-self-assign
      elem.src = elem.src;
    });
    Array.from(clonedElement.querySelectorAll('.is-editable')).forEach(elem => {
      elem.classList.remove('is-editable');
    });
  };

  const addJsonExportToZip = async (zip, boardSlug, zipDirName) => {
    const downloadJSONLink = document.querySelector('.download-json-link');
    const downloadJSONURL = downloadJSONLink.href;
    const response = await fetch(downloadJSONURL);
    const responseBody = await response.text();
    zip.file(`${zipDirName}/data/${boardSlug}.json`, responseBody);
  };

  const getBoardSlug = () => {
    // Use board ID from session instead of URL slug to keep filenames short
    const boardId = Session.get('currentBoard');
    if (boardId) {
      return boardId;
    }
    // Fallback to URL slug if session is not available
    return window.location.href.split('/').pop();
  };

  const getBoardTitle = () => {
    // Extract from page header - most reliable method
    const headerTitle = document.querySelector('h1.header-board-menu');
    if (headerTitle && headerTitle.textContent) {
      const title = headerTitle.textContent.trim();
      // Filter out translation keys like "{{_ 'templates'}}"
      if (title && !title.includes('{{')) {
        return title;
      }
    }

    // Fallback: use board slug if header title extraction fails
    return getBoardSlug();
  };

  const sanitizeFilename = (filename) => {
    // Remove or replace invalid filename characters
    // Keep alphanumeric, hyphens, underscores, and spaces
    return filename
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')  // Remove special chars
      .replace(/\s+/g, '-')                // Replace spaces with hyphens
      .replace(/-+/g, '-')                 // Replace multiple hyphens with single
      .substring(0, 100)                   // Limit to 100 chars
      .trim();
  };

  const getStylesheetList = () => {
    return Array.from(
      document.querySelectorAll('link[href][rel="stylesheet"]'),
    );
  };

  const getSrcAttached = () => {
    return Array.from(document.querySelectorAll('[src]'));
  };

  const downloadStylesheets = async (stylesheets, zip, clonedHtmlElement, zipDirName) => {
    await asyncForEach(stylesheets, async elem => {
      const response = await fetch(elem.href);
      let responseBody = await response.text();

      // Check if this is a Font Awesome CSS file
      const isFontAwesomeCSS = elem.href && (
        elem.href.includes('fontawesome') ||
        elem.href.includes('font-awesome') ||
        elem.href.includes('fa-') ||
        elem.href.includes('wekan-fontawesome')
      );

      if (isFontAwesomeCSS) {
        // For Font Awesome: preserve @font-face but update paths to local files
        responseBody = responseBody.replace(
          /url\(["']?(?:\.\.\/)?webfonts\/([^"')]+)["']?\)/gi,
          'url("../webfonts/$1")'
        );
        // Also handle upstream package paths for Font Awesome
        responseBody = responseBody.replace(
          /url\(["']?[^"']*packages\/[^/]+\/upstream\/webfonts\/([^"')]+)["']?\)/gi,
          'url("../webfonts/$1")'
        );
      } else {
        // For non-Font-Awesome CSS: remove @font-face rules to eliminate external font dependencies
        responseBody = responseBody.replace(
          /@font-face\s*\{[^}]*\}/gi,
          ''
        );

        // Replace non-Font-Awesome font families with system fonts (sans-serif)
        // But preserve Font Awesome families
        responseBody = responseBody.replace(
          /font-family\s*:\s*[^;]*(?:Roboto|Lato|Open Sans)[^;]*;/gi,
          'font-family: sans-serif;'
        );
      }

      // Fix relative paths for assets
      let finalResponse = responseBody;

      // Replace upstream package paths
      finalResponse = finalResponse.replace(
        new RegExp('packages/[^/]+/upstream/', 'gim'),
        '../',
      );

      const filename = elem.href
        .split('/')
        .pop()
        .split('?')
        .shift();
      const fileFullPath = `${zipDirName}/style/${filename}`;
      zip.file(fileFullPath, finalResponse);

      // Update the cloned HTML element, not the live one
      if (clonedHtmlElement) {
        const clonedElements = clonedHtmlElement.querySelectorAll(`link[href="${elem.href}"]`);
        clonedElements.forEach(clonedElem => {
          clonedElem.href = `./style/${filename}`;
        });
      }
    });
  };

  const downloadSrcAttached = async (elements, zip, boardSlug, clonedHtmlElement, zipDirName) => {
    await asyncForEach(elements, async elem => {
      const response = await fetch(elem.src);
      const responseBody = await response.blob();
      const filename = elem.src
        .split('/')
        .pop()
        .split('?')
        .shift();
      const fileFullPath = `${zipDirName}/${elem.tagName.toLowerCase()}/${filename}`;
      zip.file(fileFullPath, responseBody);

      // Update the cloned HTML element, not the live one
      if (clonedHtmlElement) {
        const clonedElements = clonedHtmlElement.querySelectorAll(`[src="${elem.src}"]`);
        clonedElements.forEach(clonedElem => {
          clonedElem.src = `./${elem.tagName.toLowerCase()}/${filename}`;
        });
      }
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

  const getWebFonts = () => {
    let fonts = [];

    for (let sheet of document.styleSheets) {
      // Get the base URL of the stylesheet
      let baseUrl = sheet.href ? new URL(sheet.href).origin : window.location.origin;

      try {
        for (let rule of sheet.cssRules) {
          if (rule.type === CSSRule.FONT_FACE_RULE) {
            let src = rule.style.getPropertyValue('src');
            let urlMatch = src.match(/url\(["']?(.+?)["']?\)/);
            if (urlMatch) {
              let fontUrl = urlMatch[1];
              let fontFamily = rule.style.getPropertyValue('font-family').replace(/["']/g, '');

              // Resolve the URL relative to the stylesheet's base URL
              let resolvedUrl = new URL(fontUrl, baseUrl);
              fonts.push({
                url: resolvedUrl.href,
                family: fontFamily
              }); // Using .href to get the absolute URL
            }
          }
        }
      } catch (e) {
          console.log('Access to stylesheet blocked:', e);
      }
    }

    return fonts;
  };

  const downloadFonts = async(elements, zip, zipDirName) => {
    let fontIndex = 1;
    await asyncForEach(elements, async (fontObj, idx) => {
      const elem = fontObj.url;
      const fontFamily = fontObj.family || `font${fontIndex}`;

      const response = await fetch(elem);
      const responseBody = await response.blob();

      // Try to extract a better filename
      let filename = fontFamily.replace(/[^a-z0-9-]/gi, '').substring(0, 50) || `font${fontIndex++}`;

      // If filename is empty after sanitization, use index
      if (!filename || filename.length === 0) {
        filename = `font${fontIndex++}`;
      }

      // First, try to extract filename from URL path (for normal URLs)
      if (!elem.startsWith('data:')) {
        const pathname = new URL(elem).pathname;
        const urlFilename = pathname.split('/').pop().split('?')[0].split('#')[0];
        if (urlFilename && urlFilename.length > 0 && !urlFilename.match(/^[a-f0-9]+$/i)) {
          // Only use URL filename if it's not a hash
          filename = urlFilename;
        }
      }

      // Detect format from content-type or file extension
      let extension = 'woff2';
      const contentType = response.headers.get('content-type');
      if (contentType) {
        if (contentType.includes('font/woff')) extension = 'woff';
        else if (contentType.includes('font/ttf')) extension = 'ttf';
        else if (contentType.includes('application/x-font-ttf')) extension = 'ttf';
        else if (contentType.includes('application/x-font-opentype')) extension = 'otf';
      }

      // Ensure filename has extension
      if (!filename.includes('.')) {
        filename = `${filename}.${extension}`;
      }

      const fileFullPath = `${zipDirName}/webfonts/${filename}`;
      zip.file(fileFullPath, responseBody);
    });
  }

  const downloadFontAwesomeFonts = async (zip, zipDirName) => {
    // List of Font Awesome webfont files to include
    const fontAwesomeFiles = [
      'fa-solid-900.woff2',
      'fa-solid-900.ttf',
      'fa-brands-400.woff2',
      'fa-brands-400.ttf',
      'fa-regular-400.woff2',
      'fa-regular-400.ttf',
      'fa-v4compatibility.woff2',
      'fa-v4compatibility.ttf',
    ];

    try {
      await asyncForEach(fontAwesomeFiles, async (filename) => {
        try {
          // Try to fetch from the Meteor bundle webfont location
          const fontUrls = [
            `/packages/wekan-fontawesome/webfonts/${filename}`,
            `/webfonts/${filename}`,
            `./webfonts/${filename}`,
            `../packages/wekan-fontawesome/webfonts/${filename}`,
          ];

          let response = null;
          let fetchedUrl = null;

          for (const url of fontUrls) {
            try {
              response = await fetch(url);
              if (response.ok) {
                fetchedUrl = url;
                break;
              }
            } catch (e) {
              // Try next URL
              continue;
            }
          }

          if (response && response.ok) {
            const responseBody = await response.blob();
            const fileFullPath = `${zipDirName}/webfonts/${filename}`;
            zip.file(fileFullPath, responseBody);
            console.log(`✓ Font Awesome font included: ${filename} from ${fetchedUrl}`);
          } else {
            console.log(`✗ Font Awesome font not found: ${filename}`);
          }
        } catch (e) {
          console.log(`Error downloading Font Awesome font ${filename}:`, e);
        }
      });
    } catch (e) {
      console.log('Error in downloadFontAwesomeFonts:', e);
    }
  }

  const downloadCardCovers = async (elements, zip, boardSlug, clonedHtmlElement, zipDirName) => {
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
      const fileFullPath = `${zipDirName}/covers/${filename}`;
      zip.file(fileFullPath, responseBody);

      // Update the cloned HTML element, not the live one
      if (clonedHtmlElement) {
        const bgImage = removeCssUrlSurround(elem.style['background-image']);
        const clonedElements = clonedHtmlElement.querySelectorAll('.minicard-cover');
        clonedElements.forEach(clonedElem => {
          if (removeCssUrlSurround(clonedElem.style['background-image']) === bgImage) {
            clonedElem.style.backgroundImage = `url('./covers/${filename}')`;
          }
        });
      }
    });
  };

  const addBoardHTMLToZip = (boardSlug, zip, clonedElement, zipDirName) => {
    ensureSidebarRemoved(clonedElement);

    // Get the HTML string
    let htmlString = removeAnchors(getPageHtmlString(clonedElement));

    // Inject font styling with Font Awesome exception
    // Apply sans-serif to most elements, but preserve Font Awesome icon fonts
    const fontStyleTag = `<style>
* { font-family: sans-serif !important; }
body { font-family: sans-serif !important; }
.fa, .fas, .far, .fab, .fa-solid, .fa-regular, .fa-brands, [class*="fa-"] {
  font-family: 'Font Awesome 6 Free', 'Font Awesome 6 Brands' !important;
}
</style>`;
    htmlString = htmlString.replace(
      /<\/head>/i,
      `${fontStyleTag}</head>`
    );

    // Inject interactive script into the HTML before closing body tag
    const scriptContent = `
        // Make cards interactive in exported HTML
        document.addEventListener('DOMContentLoaded', function() {
          console.log('Initializing card interactions...');

          // Create modal/popup for card details
          let modal = document.getElementById('card-details-modal');
          if (!modal) {
            modal = document.createElement('div');
            modal.id = 'card-details-modal';
            modal.style.cssText = 'display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border:1px solid #ccc;border-radius:8px;padding:20px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;z-index:10000;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
            document.body.appendChild(modal);
          }

          // Add click handlers to cards to show/hide details
          const cards = document.querySelectorAll('.minicard');
          console.log('Found ' + cards.length + ' cards');

          cards.forEach((card, idx) => {
            card.style.cursor = 'pointer';
            card.dataset.cardIndex = idx;

            card.addEventListener('click', function(e) {
              // Ignore clicks on buttons or action elements
              if (e.target.closest('button, a, .js-') || e.target.closest('[role="button"]')) {
                return;
              }

              e.preventDefault();
              e.stopPropagation();

              // Extract card title
              const title = this.querySelector('.card-title, .minicard-title, [class*="title"]');
              const titleText = title ? title.textContent.trim() : 'Card ' + this.dataset.cardIndex;

              // Get all text content from the card
              const allText = this.textContent.trim();

              // Show modal with card details
              modal.innerHTML = '<button style="position:absolute;top:10px;right:10px;padding:5px 10px;background:#f0f0f0;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Close</button>';
              modal.querySelector('button').onclick = () => { modal.style.display = 'none'; document.body.style.overflow = 'auto'; };

              const content = document.createElement('div');
              content.innerHTML = '<h2 style="margin-bottom:10px;">' + titleText + '</h2><hr style="margin:10px 0;"><div style="white-space:pre-wrap;word-wrap:break-word;font-family:sans-serif;font-size:13px;max-height:400px;overflow-y:auto;line-height:1.4;">' + allText + '</div><p style="color:#666;font-size:12px;margin-top:20px;"><em>Card #' + this.dataset.cardIndex + ' from exported board</em></p>';
              modal.appendChild(content);

              modal.style.display = 'block';
              document.body.style.overflow = 'hidden';

              console.log('Showing card details for card ' + this.dataset.cardIndex);
            });
          });

          // Add style for cards
          if (!document.getElementById('card-open-styles')) {
            const style = document.createElement('style');
            style.id = 'card-open-styles';
            style.textContent = '* { font-family: sans-serif !important; } body { font-family: sans-serif !important; } .minicard { transition: all 0.3s ease; cursor: pointer; } .minicard:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important; transform: translateY(-2px); }';
            document.head.appendChild(style);
            console.log('Added card styles and sans-serif font');
          }
        });
      `;

    // Inject script before closing body tag
    htmlString = htmlString.replace(
      /<\/body>/i,
      `<script>${scriptContent}</script></body>`
    );

    const htmlOutputPath = `${zipDirName}/index.html`;
    zip.file(
      htmlOutputPath,
      new Blob([htmlString], {
        type: 'application/html',
      }),
    );
  };

  return async () => {
    const zip = new JSZip();
    const boardSlug = getBoardSlug();
    const boardTitle = sanitizeFilename(getBoardTitle());
    const zipFilename = boardTitle || boardSlug;
    const zipDirName = zipFilename; // Directory name inside the ZIP

    // Clone the HTML element to process for export without modifying live DOM
    const htmlElement = window.document.querySelector('html');
    const clonedHtmlElement = htmlElement.cloneNode(true);

    await addJsonExportToZip(zip, boardSlug, zipDirName);
    Popup.back();

    // Process the cloned element only
    cleanBoardHtmlClone(clonedHtmlElement);

    // Pass cloned element and zipDirName to all download functions so they update the clone, not the live DOM
    await downloadStylesheets(getStylesheetList(), zip, clonedHtmlElement, zipDirName);
    await downloadSrcAttached(getSrcAttached(), zip, boardSlug, clonedHtmlElement, zipDirName);
    await downloadCardCovers(getCardCovers(), zip, boardSlug, clonedHtmlElement, zipDirName);

    // Download Font Awesome webfont files for icon support in exported HTML
    await downloadFontAwesomeFonts(zip, zipDirName);

    // Note: General fonts are not exported to keep export lightweight
    // downloadFonts(getWebFonts(), zip, zipDirName); -- skipped

    addBoardHTMLToZip(boardSlug, zip, clonedHtmlElement, zipDirName);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${zipFilename}.zip`);
    // No page reload - impersonation session is preserved!
  };
};
