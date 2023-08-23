
function initThemeChooser(settings) {
  var isInitialized = false;
  var $currentStylesheet = $();
  var $loading = $('#loading');
  var $systemSelect = $('#theme-system-selector select')
    .on('change', function() {
      setThemeSystem(this.value);
    });

  setThemeSystem($systemSelect.val());


  function setThemeSystem(themeSystem) {
    var $allSelectWraps = $('.selector[data-theme-system]').hide();
    var $selectWrap = $allSelectWraps.filter('[data-theme-system="' + themeSystem +'"]').show();
    var $select = $selectWrap.find('select')
      .off('change') // avoid duplicate handlers :(
      .on('change', function() {
        setTheme(themeSystem, this.value);
      });

    setTheme(themeSystem, $select.val());
  }


  function setTheme(themeSystem, themeName) {
    var stylesheetUrl = generateStylesheetUrl(themeSystem, themeName);
    var $stylesheet;

    function done() {
      if (!isInitialized) {
        isInitialized = true;
        settings.init(themeSystem);
      }
      else {
        settings.change(themeSystem);
      }

      showCredits(themeSystem, themeName);
    }

    if (stylesheetUrl) {
      $stylesheet = $('<link rel="stylesheet" type="text/css" href="' + stylesheetUrl + '"/>').appendTo('head');
      $loading.show();

      whenStylesheetLoaded($stylesheet[0], function() {
        $currentStylesheet.remove();
        $currentStylesheet = $stylesheet;
        $loading.hide();
        done();
      });
    } else {
      $currentStylesheet.remove();
      $currentStylesheet = $();
      done();
    }
  }


  function generateStylesheetUrl(themeSystem, themeName) {
    if (themeSystem === 'jquery-ui') {
      return 'https://code.jquery.com/ui/1.12.1/themes/' + themeName + '/jquery-ui.css';
    }
    else if (themeSystem === 'bootstrap3') {
      if (themeName) {
        return 'https://bootswatch.com/3/' + themeName + '/bootstrap.min.css';
      }
      else { // the default bootstrap theme
        return 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css';
      }
    }
    else if (themeSystem === 'bootstrap4') {
      if (themeName) {
        return 'https://bootswatch.com/4/' + themeName + '/bootstrap.min.css';
      }
      else { // the default bootstrap4 theme
        return 'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css';
      }
    }
  }


  function showCredits(themeSystem, themeName) {
    var creditId;

    if (themeSystem === 'jquery-ui') {
      creditId = 'jquery-ui';
    }
    else if (themeSystem === 'bootstrap3') {
      if (themeName) {
        creditId = 'bootstrap-custom';
      }
      else {
        creditId = 'bootstrap-standard';
      }
    }

    $('.credits').hide()
      .filter('[data-credit-id="' + creditId + '"]').show();
  }


  function whenStylesheetLoaded(linkNode, callback) {
    var isReady = false;

    function ready() {
      if (!isReady) { // avoid double-call
        isReady = true;
        callback();
      }
    }

    linkNode.onload = ready; // does not work cross-browser
    setTimeout(ready, 2000); // max wait. also handles browsers that don't support onload
  }
}
