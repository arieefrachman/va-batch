const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const pgp = require('pg-promise')();
const db = pgp('postgres://postgres:m4unGbdGs4mpsql@156.67.214.233:5434/va_basys');
const mongoose = require('mongoose');
const moment = require('moment');
mongoose.connect('mongodb://localhost/core_banking');
const { ModelTx, ModelCompany, ModelChannel, ModelBranch} = require('./models/mongoo-model');
let rp = require('request-promise');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


app.post('/va/batch', async (req, res) => {
    try {

    } catch (error) {

    }
});

app.post('/company', (req, res) => {
    try {
        const new_company = new ModelCompany({
            company_id: req.body.company_id,
            definition: req.body.definition,
            giro_acc_no: req.body.giro_acc_no,
            giro_penampung_no: req.body.giro_penampung_no,
            branch: {
                branch_code: req.body.branch.branch_code,
                branch_name: req.body.branch.branch_name,
                acc_no_rak_br: req.body.branch.acc_no_rak_br,
                acc_no_rak_ho: req.body.branch.acc_no_rak_ho
            }
        });

        new_company.save().then(() => {
            return res.json({
                msg: "OK"
            });
        });
    } catch (error) {
        return res.json({
            err: 'Error ' + err
        });
    }
});

app.post('/channel', async (req, res) => {

    try {
        let model = await ModelTx.findOne({ model_id: req.body.model_id});
        const new_channel = new ModelChannel({
            channel_id: req.body.channel_id,
            definition: req.body.definition,
            acc_no_bill: req.body.acc_no_bill,
            acc_no_fee: req.body.acc_no_fee,
            product_id: req.body.product_id,
            fee: req.body.fee,
            model: model._id
        });
        await new_channel.save();
        return res.json({
            "msg": "OK"
        });
    }catch (e) {
        return res.json({
            msg: 'Err '+ e
        });
    }
});
app.post('/modeltx', (req, res) => {
    try {
        const new_model = new ModelTx(
            {
                _id: new mongoose.Types.ObjectId(),
                model_id: req.body.model_id,
                definition: req.body.definition,
            });

        new_model.save().then(() => {
            return res.json({
                msg: "OK"
            });
        }).catch((err) => {
            return res.json(err);
        });

        //return res.json(array_push_channel);
    } catch (err) {
        return res.json({
            err: 'Error ' + err
        });
    }
});

app.post('/branch', async (req, res) => {
    try{
        let arr_rak = [];
        let rak = {};

        //console.log(req.body.rak);

        for (let item of req.body.rak){
            rak = {
                "branch_code_rak": item.branch_code_rak,
                "acc_no": item.acc_no
            };
            arr_rak.push(rak);
        }
        const new_branch = new ModelBranch({
            "branch_code": req.body.branch_code,
            "rak": arr_rak
        });

        await new_branch.save();

        return res.json('succes');
    }catch (e) {
        return res.json({'e': e});
    }
});

app.post('/core', async (req, res) => {
    let issuer = req.body.issuer_bank_code,
        acquirer = req.body.acquire_bank_code,
        channel_id = 1, //req.body.channel,
        type_trx = 0,//req.body.type_trx,
        acc_src = req.body.acc_src;

    let company = await ModelCompany.findOne({ company_id: 1});
    let model = await ModelTx.findOne({model_id: 1});
    let modelChannel = await ModelChannel.findOne({ "channel_id": channel_id, "model": {$in : model._id}}).populate('model');

    if(issuer === 425 && acquirer === 425){
        let request = {
            reqId: "00005",
            txDate: moment().format('YYYYMMDD'),
            txHour: moment().format('HHmmss'),
            userGtw: "edugw",
            passwordGtw: "Md4bicp2bwUCwZZQN9uaSQ==",
            channelId: "33",
            corpId: "005",
            prodId: "01",
            date: moment().format('DD-MM-YYYY'),
            date_rk: moment().format('DD-MM-YYYY'),
            branchId: "001",
            txCcy: "IDR",
            nbrOfAcc: "4",
            totalAmount: "200",
            prosesId: "prc01",
            userId: "k0229",
            spvId: "",
            revSts: "0",
            txType: "O",
            refAcc: "0010301045142"
        };
        let modelBranchSrc = await ModelBranch.findOne({branch_code: "001"}, {branch_code: 1,rak: {$elemMatch: {'branch_code_rak': '504'}}});
        let modelBranchDes = await ModelBranch.findOne({branch_code: "504"}, {branch_code: 1,rak: {$elemMatch: {'branch_code_rak': '001'}}});
        switch (type_trx) {
            case 0:
                request.param = [
                    {
                        accNbr: "0010301045142",
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "k022900006",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: modelBranchSrc.rak[0].acc_no,
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "299",
                        txId: "k022900006",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: modelBranchDes.rak[0].acc_no,
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.giro_penampung_no,
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "299",
                        txId: "",
                        txMsg: "Bill Payment",
                        isFee: 0
                    }
                ];

                let options = {
                    method: 'POST',
                    uri: 'http://172.112.17.20:7070/Gateway/service/postFunc',
                    body: request,
                    json: true
                };

                rp(options)
                    .then(body => {
                        return res.json({
                            msg: "Sukses",
                            response: body
                            //date: moment().format('YYYYMMDD'),
                            //r: request
                        });
                    }).catch(err => {
                    return res.json({
                        msg: "gagal "+ err,
                        //date: moment().format('YYYYMMDD'),
                        //r: request
                    });
                });
                break;

                //return res.json(request);
            case 1:
                request.param = [
                    {
                        accNbr: "0010301045142",
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "k022900006",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    },
                    {
                        accNbr: "0010301045142",
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "299",
                        txId: "k022900006",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.branch.acc_no_rak_ho,
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.giro_penampung_no,
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "299",
                        txId: "",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    }
                ];

                return res.json(request);
            case 2:
                request.param = [
                    {
                        accNbr: "0010301045142",
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "k022900006",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: "0010301045142",
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "k022900006",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.branch.acc_no_rak_ho,
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.giro_penampung_no,
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: "0010301045142",
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "k022900006",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    },
                    {
                        accNbr: "0010301045142",
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "k022900006",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.branch.acc_no_rak_ho,
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.giro_penampung_no,
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    }
                ];
                return res.json(request);
        }
    }
    else if(issuer === 425){
        switch (type_trx) {
            case 0:
                request.param = [
                    {
                        accNbr: "0010301045142",
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "k022900006",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: "0010301045142",
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "k022900006",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.branch.acc_no_rak_ho,
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.giro_penampung_no,
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "",
                        txMsg: "Bill Payment",
                        isFee: 0
                    },
                    {
                        accNbr: "0010301045142",
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "k022900006",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    },
                    {
                        accNbr: "0010301045142",
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "k022900006",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.branch.acc_no_rak_ho,
                        dbCr: 0,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    },
                    {
                        accNbr: company.giro_penampung_no,
                        dbCr: 1,
                        refAcc: "",
                        txAmt: 100,
                        txCode: "199",
                        txId: "",
                        txMsg: "Top Up Payment",
                        isFee: 0
                    }
                ];
                let options = {
                    method: 'POST',
                    uri: 'http://172.112.17.20:7070/Gateway/service/postFunc',
                    body: request,
                    json: true
                };

                rp(options)
                    .then(body => {
                        return res.json({
                            msg: "Sukses",
                            response: body
                            //date: moment().format('YYYYMMDD'),
                            //r: request
                        });
                    }).catch(err => {
                    return res.json({
                        msg: "gagal "+ err,
                        //date: moment().format('YYYYMMDD'),
                        //r: request
                    });
                });
                break;
                //return res.json(request);
            case 1:
                return;
            case 2:
                return;
        }
        return res.json({
            msg: "Issuer only"
        });
    }
    else if(acquirer === 425){
        return res.json({
            msg: "Acquirer only"
        });
    }
    else{
        return res.json({
            msg: "Destination only"
        });
    }

});

app.get('/test', async (req,res) => {
    //let model = await ModelTx.findOne({model_id: 1});
    //let modelChannel = await ModelChannel.findOne({ "channel_id": 1, "model": {$in : model._id}}).populate('model');
    let modelBranchOrg = await ModelBranch.findOne({branch_code: "001"}, {branch_code: 1,rak: {$elemMatch: {'branch_code_rak': '504'}}});
    if(modelBranchOrg == null){
        return res.status(500).json({
            err: 'origin not found'
        });
    }
    let modelBranchDes = await ModelBranch.findOne({branch_code: "504"}, {branch_code: 1,rak: {$elemMatch: {'branch_code_rak': '001'}}});
    //let modelBranch = await ModelBranch.find({branch_code: "001"});
    if(modelBranchDes == null){
        return res.status(500).json({
            err: 'des not found'
        });
    }
    return res.json({
        org: modelBranchOrg.rak[0].acc_no,
        des: modelBranchDes.rak[0].acc_no
    });
});


function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        jwt.verify(bearerToken, 'vabjbssecret', (err, data) => {
            if (err) {
                return res.status(403).json({
                    rc: "#002",
                    rm: "Token mismatch!"
                });
            } else {
                next();
            }
        });
    } else {
        return res.status(403).json({
            rc: "#002",
            rm: "Forbidden"
        });
    }
}

function sendCBS(){
    let options = {
        method: 'POST',
        uri: 'http://172.112.17.20:7070/Gateway/service/postFunc',
        body: request,
        json: true
    };

    rp(options)
        .then(body => {
            return res.json({
                msg: "Sukses",
                response: body
                //date: moment().format('YYYYMMDD'),
                //r: request
            });
        }).catch(err => {
        return res.json({
            msg: "gagal "+ err,
            //date: moment().format('YYYYMMDD'),
            //r: request
        });
    });
}

app.listen(3001, () => console.log('Listening on port 3001!'));