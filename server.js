/* https://myaccount.google.com/lesssecureapps?pli=1&rapt=AEjHL4ME_oaV_eoDoi0QCSE3MyZ9_AVHjoHJa7BeOicEoHzJf_o7kmnIiAt53_i26MoMMgb3TBhtoSWL1m6Y8ulWmOxBBSvMhw */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 5000;
const Adverts = require('./Adverts');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api", Adverts);

app.listen(port, function() {
    console.log("Server avviato sulla porta: "+ port);
})