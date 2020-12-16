const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 5000;
const Adverts = require('./router/Adverts');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api", Adverts);

app.listen(port, () => console.log("Server avviato sulla porta: "+ port));