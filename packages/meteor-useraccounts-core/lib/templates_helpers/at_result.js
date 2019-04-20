AT.prototype.atResultHelpers = {
    result: function() {
        var resultText = AccountsTemplates.state.form.get("result");
        if (resultText)
            return T9n.get(resultText, markIfMissing=false);
    },
};