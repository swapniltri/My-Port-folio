const express=require("express");
const bodyParser=require("body-parser");
const app=express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


const ejs=require("ejs");
app.set('view engine','ejs');

//Config
const dotenv = require("dotenv");
dotenv.config({path:"./config.env"});

const mongoose=require("mongoose");

//Session Configuration
const session = require("express-session");
const MongoStore = require("connect-mongodb-session")(session); //Local storage on mongoDB atlas.

const DB = process.env.DB_URL;
mongoose.connect(DB,{useNewUrlParser:true,useUnifiedTopology:true}).then(() => {
    console.log("connection successful");
}).catch((err) => console.log("No connection"));

//Establishing the session connection with mongoDB, after connecting the application to mongoDB

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        uri: DB,
        collection: "session"
    }),
    cookie:{
        maxAge: 1000 * 60 * 60 * 24 //1 day in milisec.
    }
}));

const peopleSchema=new mongoose.Schema({
    username:String,
    email:String,
    password:String
});

const secretsSchema=new mongoose.Schema({
    user:String,
    heading:String,
    content:String
});

const People=mongoose.model("People",peopleSchema);
const Secrets=mongoose.model("Secrets",secretsSchema);

const isAuth = function(req,res,next){
    if(req.session.isAuth){
        next();
    }else{
        res.redirect("/secrets");
    }
}

const isLoggedIn = function(req,res,next){
    if(req.session.isAuth){
        res.redirect("/secrets");
    }else{
        next();
    }
}

app.get("/",function(req,res){
    res.render("index");
});

app.get("/login", isLoggedIn ,function(req,res){
    res.render("login",{signup:"",incpass:""});
});

app.post("/login",function(req,res){
    const username=req.body.username;
    const password=req.body.password;
    People.findOne({username:username},function(err,foundUser){
        if(foundUser){
            if(foundUser.password === password){
                req.session.username = username;
                req.session.isAuth = true;
                res.redirect("/secrets");
            } else {
                res.render("login",{incpass:"! Incorrect Password" , signup:""});
            }
        } else {
            res.render("login",{signup:"please, sign up first",incpass:""});
        }
    });
});

app.get("/signup",function(req,res){
    res.render("signup",{notRegisteredU:"",notRegisteredE:""});
});

app.post("/signup",function(req,res){
    const username = (req.body.username).trim();
    const email = req.body.email;
    const password = req.body.password;
    People.findOne({username: req.body.username},function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(!foundUser){
                People.findOne({email: req.body.email},function(err,foundMail){
                    if(err){
                        console.log(err);
                    }else{
                        if(!foundMail){
                            req.session.username = username;
                            req.session.isAuth = true;
                            const newUser=new People({
                                username: username,
                                email: email,
                                password: password
                            });
                            newUser.save();
                            res.redirect("/secrets");
                        }else{
                            res.render("signup",{notRegisteredU:"", notRegisteredE:"This email is already in use"});
                        }
                    }
                });
            }else{
                res.render("signup",{notRegisteredU:"User already exist", notRegisteredE:""});
            }
        }
    });
});

app.get("/secrets", isAuth , function(req,res){
    Secrets.find({},function(err,foundArray){
        if(err){
            console.log(err);
        }else{
            res.render("secrets",{array:foundArray});
        }
    });
});





app.post("/secrets", isAuth ,function(req,res){
    const putSecrets=new Secrets({
        user:req.session.username,
        heading:req.body.head,
        content:req.body.body
    });
    putSecrets.save();
    res.redirect("/secrets");
});

app.post("/delete", isAuth ,function(req,res){
    const title=req.body.hiddenInput2;
    const user=req.body.hiddenInput1;
    if(req.session.username === user){
        Secrets.deleteOne({heading:title},function(err){
            if(err){
                console.log(err);
            } else {
                console.log("Deleted Successfully");
            }
        });
    }
    res.redirect("/secrets");
});

app.get("/signout", isAuth ,function(req,res){
    req.session.destroy(err => {
        console.log(err);
    });
    res.redirect("/");
});

app.listen(process.env.PORT || 3000,function(){
    console.log("server started on port 3000");
});