//importing dependencies
const express = require("express")
const app=express();
var mongoose=require("mongoose");
var bodyParser=require("body-parser");
var rand = require("generate-key");
require('dotenv').config()
const axios = require('axios');
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')
const fs = require('fs')
const path = require('path');

const validationMiddleware = require('./middleware/validation-middleware');
  
// Calling form.js from models
var Form=require("./models/form");

let db;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8p9v3.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose.connect(uri,(err, client) => {

    if(err) throw err;

    console.log('conectado correcto')

})

const apiLimiter  = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10 // limit each IP to 2 requests per windowMs
})

let logStream = fs.createWriteStream(path.join(__dirname, 'file.log'), {flags: 'a'})

morgan.token("custom", ":http-version (:method) :url => :status")

function onlyHomeRequests(req, res) {

    if(req.url == "/" ){

        return req.url
    }

    if(req.url == "/result"){

        return req.url
    }

}


app.use(morgan('custom', { stream: logStream, skip: onlyHomeRequests}))

app.use("/price/", apiLimiter);
  
//middlewares
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
  
//rendering form.ejs
app.get("/",function(req,res){

    res.render("form");
});

app.get("/price",async function(req,res){

    try{

        var keyreq = req.query.key

        var symbol = req.query.symbol

        console.log(symbol)

        const final = await Form.findOne({ key: keyreq })

        if(keyreq != undefined && symbol != undefined){

            if(final['key'] == keyreq){

                axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=X86NOH6II01P7R24`)
                .then(function (response) {
                    // handle success
                    //console.log(typeof response);
                    //console.log(typeof response['data']['Time Series (Daily)'])
    
                    var obj = response['data']['Time Series (Daily)'];
    
                    var aux = null
    
                    var dif = 0
    
                    var cierres = []
    
                    var objects = []
    
                    Object.keys(obj).forEach(key => {
    
                        var data = new Object();
    
                        //console.log(key);
    
                        data.fecha = key;
    
                        var obj2 = obj[key];
    
                        Object.keys(obj2).forEach(key=>{
    
                            key ==='1. open' ? data.apertura = obj2[key]: ''

                            key ==='4. close' ? data.cierre = obj2[key]: ''
    
                            key ==='2. high' ? data.maximo = obj2[key]: ''
    
                            key ==='3. low' ? data.minimo = obj2[key]: ''
    
                            key ==='4. close' ? data.difCierreAnterior = '': ''
    
                            key ==='5. volume' ? data.volumen = obj2[key]: ''
    
                            
    
    
                            //console.log(key, obj2[key])
                            if(key ==='4. close'){
    
                                //console.log(key)
    
                                var close = obj2[key]
    
                                if (aux == null){
    
                                    aux = parseInt(close)
                                    
                                }
                                else{
    
                                    dif = aux - parseInt(close)
    
                                    aux = parseInt(close)
    
                                    cierres.push(dif);
                                }
    
                            }
                        })
    
                        objects.push(data)
    
                    });
    
                    objects.forEach((e,key)=>{
    
                        e.difCierreAnterior = cierres[key]
                    })
    
                    //objects.forEach(e=>console.log(e))
                    
    
                    res.send(objects) 
    
                      
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                })
    
    
            }

        }

        else{

            res.send({
                error: 404,
                mensaje: 'la key y/o symbol son necesarios'
            })


        }


    }

    catch{

        res.send({
            error: 404,
            mensaje: 'la key y/o symbol son incorrectos'
        })

    }

    

});
  
// form submission
app.get('/result',(req,res)=>{
    res.render('result');
});
  
//creating form
app.post("/", validationMiddleware.signup, function(req,res){

    var key = rand.generateKey();

    var name=req.body.name;
    var surname =req.body.surname;
    var email=req.body.email;
    var f={name: name, surname:surname, key:key, email:email};
    Form.create(f,function(err,newlyCreatedForm){
        if(err)
        {
            console.log(err);
        }else{

            var html = `<h1>la key para que uses en tu acceso a la api es: ${key}</h1><br>
                        <a href="/">Ir al inicio</a>`
            res.send(html);
        }
    });
});
  
// Starting the server at port 3000
app.listen(3000, function() { 
    console.log('Server running on port 3000'); 
});