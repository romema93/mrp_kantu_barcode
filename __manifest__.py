# -*- coding: utf-8 -*-
{
    'name': "Mrp Kantu Barcode",

    'summary': """
        Codigo de Barras para Mrp Kantu""",

    'description': """
        Long description of module's purpose
    """,

    'author': "Ceramicas Kantu S.A.C.",
    'website': "http://www.ceramicaskantu.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/odoo/addons/base/module/module_data.xml
    # for the full list
    'category': 'mrp',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'mrp', 'mrp_kantu', 'barcodes'],

    # always loaded
    'data': [
        "views/mrp_kantu_barcode_assets.xml",
        "views/mrp_kantu_barcode_views.xml",
    ],
    'qweb': [
        "static/src/xml/mrp_kantu_barcode.xml",
    ],
    'images': [
        # 'static/logo.png',
    ],
}
