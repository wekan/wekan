async loadLanguage(language) {
  if (language in languages && 'load' in languages[language]) {
    let data = await languages[language].load();

    ...
},
