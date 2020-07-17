odoo.define('mrp_kantu.barcode', function (require) {
    "use strict";

    var core = require('web.core');
    var Model = require('web.Model');
    var Widget = require('web.Widget');
    var Session = require('web.session');
    var BarcodeHandlerMixin = require('barcodes.BarcodeHandlerMixin');

    var QWeb = core.qweb;

    var CodigoBarras = Widget.extend(BarcodeHandlerMixin, {
        template: "MrpBarcode",
        events: {
            'click a#back': function () {
                if (this.state != 'main') {
                    if (this.state == 'barcodeCamera'){
                        Quagga.stop();
                    }
                    this.state = 'main';
                    this.renderView();
                }
            },
            'click #btn-camera-scan': "BarcodeCamera",
            'click #select-op': "GetOps",
            'click div.op': "GetWos",
            'click div.wo': "OperationWo",
            'click button#btn-done': function () {
                this.AttendanceOperationWo('done');
            },
            'click button#btn-stop': function () {
                this.AttendanceOperationWo('stop');
            },
            'click button#btn-continue': function () {
                this.AttendanceOperationWo('start');
            },
            'click button#btn-start': function () {
                this.AttendanceOperationWo('start');
            },
            'click button#btn-start-p': function () {
                this.AttendanceOperationWo('start');
            },
            'click button#change-camera': function(){
                if(this.listCameras.length > 1){
                    this.cameraDevice = this.listCameras.filter(function(cameraDevice){return cameraDevice.active === false})[0];
                    Quagga.stop();
                    this.InitQuagga();
                }
            }
        },
        init: function (parent, action) {
            this._super;
            this.barcode = "";
            this.cameraDevice = false;
            this.QuaggaState = {
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    //target: document.querySelector("#camera-scan")
                },
                decoder: {
                    readers: ["code_128_reader"]
                }
            };
            BarcodeHandlerMixin.init.apply(this, arguments);
        },
        start: function () {
            var self = this;
            self.state = 'main';
            self.containerViews = self.$('#container_views');
            FastClick.attach(document.body);
            return this._super().then(function () {
                self.renderView();
                self.$barcodeCamera = self.$('#camera-scan');
            });
        },
        on_barcode_scanned: function (barcode) {
            this.barcode = barcode;
            this.AttendanceBarcode();
        },
        BarcodeCamera: function () {
            var self = this;
            self.state = 'barcodeCamera';
            self.renderView();
        },
        InitQuagga: function (cameraDevice) {
            var self = this;
            if (self.cameraDevice != false){
                self.QuaggaState.inputStream.constraints = { deviceId: self.cameraDevice.device.deviceId };
            }
            Quagga.init(self.QuaggaState, function (err) {
                if (err) {
                    self.do_warn(err);
                    return;
                }
                self.LoadListCameras().then(function(){
                   Quagga.start();
                });
            });
            Quagga.onProcessed(function(result) {
                var drawingCtx = Quagga.canvas.ctx.overlay,
                    drawingCanvas = Quagga.canvas.dom.overlay;

                if (result) {
                    if (result.boxes) {
                        drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                        result.boxes.filter(function (box) {
                            return box !== result.box;
                        }).forEach(function (box) {
                            Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "green", lineWidth: 2});
                        });
                    }

                    if (result.box) {
                        Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
                    }

                    if (result.codeResult && result.codeResult.code) {
                        Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
                    }
                }
            });
            Quagga.onDetected(function (data) {
                var code = data.codeResult.code;
                if (self.barcode !== code) {
                    self.barcode = code;
                    self.AttendanceBarcode(true);
                }
            });
        },
        StopQuagga: function () {
            Quagga.stop();
            this.state = 'main';
            this.renderView();
        },
        LoadListCameras: function (){
            var self = this;
            var dfd = $.Deferred();
            self.listCameras = [];
            var streamLabel = Quagga.CameraAccess.getActiveStreamLabel();
            Quagga.CameraAccess.enumerateVideoDevices()
                .then(function(devices){
                    for(let i=0; i<devices.length; i++){
                        var cameraDevice = {};
                         cameraDevice.device = devices[i];
                         cameraDevice.active = streamLabel === devices[i].label;
                         self.listCameras.push(cameraDevice);
                    }
                    dfd.resolve(true);
                });
            return dfd;
        },
        SelectedColor: function(number){
            var objectColor = {};
            switch(number){
                case 0:
                    objectColor.background = '#ffffff';
                    objectColor.color = '#5a5a5a';
                    break;
                case 1:
                    objectColor.background = '#d8d8d8';
                    objectColor.color = '#5e5e5e';
                    break;
                case 2:
                    objectColor.background = '#e5d8e3';
                    objectColor.color = '#7a3737';
                    break;
                case 3:
                    objectColor.background = '#ece9c2';
                    objectColor.color = '#756832';
                    break;
                case 4:
                    objectColor.background = '#dee180';
                    objectColor.color = '#5d6937';
                    break;
                case 5:
                    objectColor.background = '#abd4cc';
                    objectColor.color = '#1a7759';
                    break;
                case 6:
                    objectColor.background = '#b8e3e8';
                    objectColor.color = '#1a5d83';
                    break;
                case 7:
                    objectColor.background = '#f4ddab';
                    objectColor.color = '#5e5e5e';
                    break;
                case 8:
                    objectColor.background = '#7f637d';
                    objectColor.color = '#a5a5a5';
                    break;
                case 9:
                    objectColor.background = '#d8c5d5';
                    objectColor.color = '#5e5e5e';
                    break;
            }
            return objectColor;
        },
        /*************************************************
            PETICIONES AL SERVIDOR
        *************************************************/
        GetOps: function () {
            var self = this;
            var OrderProduction = new Model('mrp.production');
            OrderProduction.call('attendance_get_ops').then(function(ops){
                self.state = 'selectOp';
                self.renderView(ops);
            });
        },

        GetWos: function (e) {
            var self = this,
                op_id = e!=undefined ? parseInt(e.currentTarget.dataset.id) : this.MrpProduction.id,
                MrpProduction = new Model("mrp.production"),
                WorkOrders = new Model("mrp.workorder");
            self.session.user_has_group('mrp_kantu.group_mrp_operario').then(function(has_group){
                if(has_group){
                    MrpProduction.query(['name', 'product_id', 'workorder_ids']).filter([['id', '=', op_id]]).first().then(function (op) {
                        self.MrpProduction = op;
                        WorkOrders.query(['name','workcenter_id','color_workcenter']).filter([['id', 'in', self.MrpProduction.workorder_ids], ['state', 'not in', ['supervisado', 'done']]]).all().then(function (wos) {
                            for (var i in wos){
                                wos[i].objectColor = self.SelectedColor(wos[i].color_workcenter)
                            }
                            var woGroupByWc = _.groupBy(wos,function(wo){return wo.workcenter_id[1];});
                            var workcenters = []
                            for (var wo in woGroupByWc){
                                workcenters.push({'workcenter_id':woGroupByWc[wo][0].workcenter_id,'workorder_ids':woGroupByWc[wo]});
                            }
                            self.state = 'selectWo';
                            self.Workorders = wos;
                            self.workcenters = workcenters;
                            self.renderView();
                        });
                    });
                }else{
                    self.do_action({
                        'type': 'ir.actions.act_window',
                        'res_model': 'mrp.production',
                        'res_id': op_id,
                        'view_mode': 'form',
                        'view_type': 'form',
                        'views': [[false, 'form']],
                        'target': 'current'
                    });
                }
            })
        },

        OperationWo: function (e) {
            var self = this,
                wo_id = parseInt(e.currentTarget.dataset.id),
                WorkOrder = new Model("mrp.workorder");
            WorkOrder.query([]).filter([['id', '=', wo_id]]).first().then(function (wo) {
                self.state = 'operationWo';
                self.workorder_id = wo_id;
                wo.productImageUrl = '/web/image/?model=product.template&id=' + wo.product_id[0] + '&field=image'
                self.renderView(wo);
            });
        },

        AttendanceBarcode: function (active_quagga) {
            var self = this, MrpProduction = new Model('mrp.production');
            MrpProduction.call('attendance_scan_barcode', [self.barcode,]).then(function (result) {
                self.barcode = "";
                self.MrpProduction = result.mrp_production;
                self.Workorders = result.workorders;
                if (result.workorders) {
                    if (result.workorders.length > 1) {
                        //self.state = 'selectWo';
                        //self.renderView();
                        self.GetWos();
                    } else {
                        self.state = 'operationWo';
                        self.renderView(result.workorders[0]);
                    }
                    if (active_quagga) {
                        Quagga.stop();
                    }
                }
                else if (result.action) {
                    if (active_quagga) {
                        self.StopQuagga();
                    }
                    self.do_action(result.action);
                }
                else if (result.warning){
                    self.do_warn(result.warning);
                }
                else {
                    self.do_warn("No se pudo detectar el codigo, intentelo nuevamente");
                }
            });
        },

        ModalConfirmation: function () {
            var dfd = $.Deferred(), $modal = this.$('#modal-confirmation');
            $modal.find('#ok').on('click', function () {
                $modal.modal('hide');
                dfd.resolve(true);
            })
            $modal.find('#cancel').on('click', function () {
                $modal.modal('hide');
                dfd.resolve(false);
            })
            $modal.modal({ backdrop: false });
            return dfd.promise();
        },

        AttendanceOperationWo: function (action) {
            var self = this;
            this.ModalConfirmation().then(function (ok) {
                if (ok) {
                    var WorkOrder = new Model('mrp.workorder');
                    WorkOrder.call('attendance_operation_wo', [self.workorder_id, action]).then(function (result) {
                        if (result.wo) {
                            self.state = 'main';
                            self.renderView();
                        }
                    })
                }
            })
        },

        /*************************************************
          FUNCIONES QUE RENDERIZAN LAS DIFERENTES VISTAS
        *************************************************/
        // Funcion que determina que renderizar segun el estado
        renderView: function (data) {
            switch (this.state) {
                case 'main':
                    this.renderMainBarcode(data);
                    break;
                case 'selectOp':
                    this.renderSelectOp(data);
                    break;
                case 'selectWo':
                    this.renderSelectWo();
                    break;
                case 'operationWo':
                    this.renderOperationWo(data);
                    break;
                case 'barcodeCamera':
                    this.renderBarcodeCamera();
                    break;
            }
        },
        // Renderiza la pantalla principal
        renderMainBarcode: function (data) {
            var self = this;
            navigator.mediaDevices.enumerateDevices()
                .then(function(devices){
                    var videoDevices = devices.filter(function(x){return x.kind === 'videoinput'});
                    var webcamAvailable = videoDevices.length > 0 ? true : false;
                    self.containerViews.html(QWeb.render("MainBarcode", {'webcamAvailable':webcamAvailable}));
                })
        },
        // Renderiza las Ordenes de Produccion que esten 'planificadas' o en 'proceso'
        renderSelectOp: function (data) {
            this.containerViews.html(QWeb.render("SelectOp", { ops: data }));
        },
        //Renderiza las ordenes de trabajo relacionas a una Orden de Produccion
        renderSelectWo: function () {
            this.containerViews.html(QWeb.render("SelectWo", { op: this.MrpProduction, wos: this.Workorders, workcenters:this.workcenters }));
        },
        //Renderiza las ordenes de trabajo relacionas a una Orden de Produccion
        renderOperationWo: function (data) {
            this.containerViews.html(QWeb.render("OperationWo", { wo: data }));
        },
        renderBarcodeCamera: function () {
            this.containerViews.html(QWeb.render("BarcodeCamera"));
            this.QuaggaState.inputStream.target = document.querySelector("#camera-scan");
            this.InitQuagga();
        },
    });

    core.action_registry.add('mrp_kantu_barcode', CodigoBarras);

    return CodigoBarras;

});