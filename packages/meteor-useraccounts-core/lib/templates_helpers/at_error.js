AT.prototype.atErrorHelpers = {
    singleError: function() {
        var errors = AccountsTemplates.state.form.get("error");
        return errors && errors.length === 1;
    },
    error: function() {
        return AccountsTemplates.state.form.get("error");
    },
    errorText: function(){
        var field, err;
        if (this.field){
            field = T9n.get(this.field, markIfMissing=false);
            err = T9n.get(this.err, markIfMissing=false);
        }
        else
            err = T9n.get(this.valueOf(), markIfMissing=false);

        // Possibly removes initial prefix in case the key in not found inside t9n
        if (err.substring(0, 15) === "error.accounts.")
            err = err.substring(15);

        if (field)
            return field + ": " + err;
        return err;
    },
};
