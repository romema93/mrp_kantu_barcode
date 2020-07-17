# -*- coding: utf-8 -*-
from datetime import datetime
from dateutil.relativedelta import relativedelta

from odoo import api, models, fields, _
from odoo.exceptions import UserError


class MrpWorkorder(models.Model):
    _inherit = "mrp.workorder"

    color_workcenter = fields.Integer('Color', store=False, related='workcenter_id.color')

    def _compute_is_user_working(self):
        for order in self:
            if order.time_ids.filtered(lambda x: (not x.date_end) and (x.loss_type in ('productive', 'performance'))):
                order.is_user_working = True
            else:
                order.is_user_working = False

    @api.multi
    def end_previous(self, doall=False):
        timeline_obj = self.env['mrp.workcenter.productivity']
        domain = [('workorder_id', 'in', self.ids), ('date_end', '=', False)]
        # -------------------------------------------------------------
        # SE COMENTA ESTE SEGMENTO PARA QUITAR EL FILTRO DEL USUARIO
        # if not doall:
        #    domain.append(('user_id', '=', self.env.user.id))
        # --------------------------------------------------------------
        not_productive_timelines = timeline_obj.browse()
        for timeline in timeline_obj.search(domain, limit=None if doall else 1):
            wo = timeline.workorder_id
            if wo.duration_expected <= wo.duration:
                if timeline.loss_type == 'productive':
                    not_productive_timelines += timeline
                timeline.write({'date_end': fields.Datetime.now()})
            else:
                maxdate = fields.Datetime.from_string(timeline.date_start) + relativedelta(
                    minutes=wo.duration_expected - wo.duration)
                enddate = datetime.now()
                if maxdate > enddate:
                    timeline.write({'date_end': enddate})
                else:
                    timeline.write({'date_end': maxdate})
                    not_productive_timelines += timeline.copy({'date_start': maxdate, 'date_end': enddate})
        if not_productive_timelines:
            loss_id = self.env['mrp.workcenter.productivity.loss'].search([('loss_type', '=', 'performance')], limit=1)
            if not len(loss_id):
                raise UserError(_(
                    "You need to define at least one unactive productivity loss in the category 'Performance'. Create one from the Manufacturing app, menu: Configuration / Productivity Losses."))
            not_productive_timelines.write({'loss_id': loss_id.id})
        return True

    @api.model
    def attendance_operation_wo(self, id, action):
        wo = self.browse(id)
        if action == 'start':
            wo.button_start()
        elif action == 'stop':
            wo.button_pending()
        elif action == 'continue':
            wo.button_start()
        elif action == 'done':
            wo.record_production()
        return {
            'wo': wo.read()
        }
