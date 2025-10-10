require('dotenv').require('config');
require('./db/config');
const express  = require('express');
const app= express();
const cors = require('cors');
app.use(cors());
const bodyParser =require('bodyParser');
// Parse requests of content-type - application/json
app.use(express.json());
// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res, next) => {
  console.log("Moving to next middleware...");
  next(); 
});

app.use((req, res) => {
  res.send("No user ID provided (from next middleware)");
});

app.listen(5000,()=>{
    console.log('server started at port 5000');
})