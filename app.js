const express=require("express");
const bodyParser=require("body-parser");
const app=express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


const ejs=require("ejs");
app.set('view engine','ejs');


const mongoose=require("mongoose");

const DB = "mongodb+srv://swapnil-admin:test123@cluster0.fesmd.mongodb.net/peopleDB?retryWrites=true&w=majority";
mongoose.connect(DB,{useNewUrlParser:true,useUnifiedTopology:true}).then(() => {
    console.log("connection successful");
}).catch((err) => console.log("No connection"));


const peopleSchema=new mongoose.Schema({
    email:String,
    password:String
});

const secretsSchema=new mongoose.Schema({
    heading:String,
    content:String
});

const People=mongoose.model("People",peopleSchema);
const Secrets=mongoose.model("Secrets",secretsSchema);

// const mySecret1=new Secrets({
//     heading:"My Secret",
//     content:"I love to watch Cartoons"
// });

const mySecret2=new Secrets({
    heading:"Codechef",
    content:"4⭐ coder at Codechef."
});

const mySecret3=new Secrets({
    heading:"Codeforces",
    content:"Specialist on Codeforces"
});

const mySecret=[mySecret2,mySecret3];

// mySecret1.save();
// mySecret2.save();
// mySecret3.save();

app.get("/",function(req,res){
    res.render("index");
});

app.get("/login",function(req,res){
    res.render("login",{signup:"",incpass:""});
});

app.get("/signup",function(req,res){
    res.render("signup",{notRegistered:""});
});

app.get("/secrets",function(req,res){
    Secrets.find({},function(err,foundArray){
        if(foundArray.length === 1){
            if(foundArray[0].heading === "Codechef"){
                Secrets.insertMany([mySecret3],function(err){
                    if(err){
                        console.log(err);
                    }else{
                        res.redirect("/secrets");
                    }
                });
            }else{
                Secrets.insertMany([mySecret2],function(err){
                    if(err){
                        console.log(err);
                    }else{
                        res.redirect("/secrets");
                    }
                });
            }
            // Secrets.insertMany(mySecret,function(err){
            //     if(err){
            //         console.log(err);
            //     } else {
            //         res.redirect("/secrets");
            //     }
            // });
        } else {
            res.render("secrets",{array:foundArray});
        }
    });
});

app.post("/login",function(req,res){
    const email=req.body.email;
    const password=req.body.password;
    People.findOne({email:email},function(err,foundUser){
        if(foundUser){
            if(foundUser.password === password){
                res.redirect("secrets");
            } else {
                res.render("login",{incpass:"! Incorrect Password" , signup:""});
            }
        } else {
            res.render("login",{signup:"please, sign up first",incpass:""});
        }
    });
});

app.post("/signup",function(req,res){
    People.findOne({email:req.body.email},function(err,foundEmail){
        if(!foundEmail){
            const newUser=new People({
                email: req.body.email,
                password: req.body.password
            });
            newUser.save();
            res.redirect("secrets");
        } else {
            res.render("signup",{notRegistered:"! This email is already registered"});
        }
    });
});

app.post("/secrets",function(req,res){
    const putSecrets=new Secrets({
        heading:req.body.head,
        content:req.body.body
    });
    putSecrets.save();
    res.redirect("/secrets");
});

app.post("/delete",function(req,res){
    const title=req.body.hiddenInput;
    Secrets.deleteOne({heading:title},function(err){
        if(err){
            console.log(err);
        } else {
            console.log("Deleted Successfully");
        }
    });
    res.redirect("/secrets");
});

app.listen(process.env.PORT || 3000,function(){
    console.log("server started on port 3000");
});