window.moment = moment;

Template.fullcalendar.rendered = function() {
    var div = this.$(this.firstNode);
    if(this.data != null) {
        //jquery takes care of undefined values, no need to check here
        div.attr('id', this.data.id);
        div.addClass(this.data.class);
    }
    div.fullCalendar(this.data);
};
