const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let modelChannel = new Schema({
    channel_id: {type: Number, index: true},
    definition: String,
    acc_no_bill: String,
    acc_no_fee: String,
    product_id: String,
    fee: Number,
    model: { type: Schema.Types.ObjectId, ref: 'ModelTx'}
});
let modelTx = new Schema({
    _id: mongoose.Types.ObjectId ,
    model_id: {type: Number, index: true},
    definition: String
});

let modelBranch = new Schema({
    branch_code: String,
    rak: [{
        branch_code_rak: String,
        acc_no: String
    }]
});
let modelCompany = new Schema({
    company_id: {type: Number, index: true },
    company_name: String,
    giro_acc_no: String,
    giro_penampung_no: String
});

module.exports = {
    ModelTx: mongoose.model('ModelTx', modelTx),
    ModelCompany: mongoose.model('Company', modelCompany),
    ModelChannel: mongoose.model('Channel', modelChannel),
    ModelBranch: mongoose.model('Branch', modelBranch)
};