odoo.define('mrp_kantu_barcode.mrp_state', function(require) {
"use strict";

var core = require('web.core');
var Model = require('web.Model');
var time = require('web.time');
var MrpTimeCounter = core.form_widget_registry.get('mrp_time_counter');

MrpTimeCounter.include({
    render_value: function() {
        this._super.apply(this, arguments);
        var self = this;
        this.duration;
        var productivity_domain = [['workorder_id', '=', this.field_manager.datarecord.id]];
        new Model('mrp.workcenter.productivity').call('search_read', [productivity_domain, []]).then(function(result) {
            if (self.get("effective_readonly")) {
                self.$el.removeClass('o_form_field_empty');
                var current_date = new Date();
                self.duration = 0;
                _.each(result, function(data) {
                    self.duration += data.date_end ? self.get_date_difference(data.date_start, data.date_end) : self.get_date_difference(time.auto_str_to_date(data.date_start), current_date);
                });
                self.start_time_counter();
            }
        });
    }
})

});