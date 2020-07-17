# -*- coding: utf-8 -*-
from odoo import api, models, fields


class MrpProduction(models.Model):
    _inherit = "mrp.production"

    @api.model
    def attendance_get_ops(self):
        user = self.env['res.users'].browse(self.env.uid)
        ops = self.search([['state', 'in', ('planned', 'progress')]])
        if user.has_group('mrp_kantu.group_mrp_operario'):
            ops = ops.filtered(
                lambda x: any([workorder.state not in ['done', 'supervisado'] for workorder in x.workorder_ids]))
        return ops.read(['name', 'product_id', 'mrp_sec_qty', 'mrp_sec_uom'])

    @api.model
    def attendance_scan_barcode(self, barcode):
        user = self.env['res.users'].browse(self.env.uid)
        production = self.search([('name', '=', barcode)], limit=1)
        is_manager = bool(user.has_group('mrp.group_mrp_manager'))
        is_supervisor = bool(user.has_group('mrp_kantu.group_mrp_supervisor'))
        if production:
            if user.has_group('mrp_kantu.group_mrp_operario'):
                workorder = production.workorder_ids.filtered(
                    lambda w: w.state in ['ready', 'progress', 'pending'])
                if workorder:
                    return {'workorders': workorder.read(),
                            'mrp_production': {'product_id': [production.product_id.id, production.product_id.name],
                                               'name': production.name,
                                               'id': production.id}}
                else:
                    return {
                        'warning': ('La ficha no esta lista')
                    }
            elif user.has_group('mrp.group_mrp_user') and not is_manager and not is_supervisor:
                return {'action': {
                    'type': 'ir.actions.act_url',
                    'url': '/kantu/produccion/' + str(production.id),
                    'target': 'self',
                }}
            else:
                return {'action': {
                    'type': 'ir.actions.act_window',
                    'res_model': 'mrp.production',
                    'res_id': production.id,
                    'view_mode': 'form',
                    'view_type': 'form',
                    'views': [[False, 'form']],
                    'target': 'current'
                }}
        else:
            return False
