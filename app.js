const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(passport.initialize());

mongoose.connect('mongodb://127.0.0.1:27017/mongoposts',{useNewUrlParser:true});

mongoose.connection.on('connected',()=>{
    console.log('Connected');
    
})

mongoose.connection.on('error',()=>{
    console.log('cannot connect to the mongoose');
    
})

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required: true
    },
    password:{
        type:String,
        required: true
    }
});


const MongoModel = mongoose.model('user',userSchema);

const jwtSchema = mongoose.Schema({
    token:String,
    username:String,
    user : userSchema
});

const jwtModel = mongoose.model('jwttoken',jwtSchema);

const postSchema = mongoose.Schema(
    {
        post:String,
        comments:[{}],
        userId:String
    }
);

const postsModel = mongoose.model('post',postSchema);


// const exampleschema = new jwtModel({token:'fsdddfsd',user:{name:'sriniJWTTEst',email:'jwtemail@mail.com',password:'somejwtpass'}});
// exampleschema.save(()=>{
//     console.log('added');
// });



// const exampleschema = new MongoModel({name:'SriniDadapp',email:'Sometestingemail@testmail.com',password:'abcd123'});
// exampleschema.save(()=>{
//     console.log('added');
// });


app.post('/jwtaccess',(req,res)=>{
    console.log(req.body.jwttoken);
    jwtModel.findOne({token:req.body.jwttoken},(err,token)=>{

        if(!token){
            return res.status(403).send({tokenexists:false});
        }
        res.send({tokenexists:true,token:token});
    });
})


app.get('/',(req,res)=>{
    res.send('Hello there');
});

app.post('/getposts',(req,res)=>{
   // console.log(req.body.email);
    postsModel.find({userId:req.body.userId},(err,data)=>{
        if(data){
            //console.log(data);
           return res.send(data);
        }
        res.send({error:err})
    })
});

app.post('/post',(req,res)=>{
    newPost = new postsModel({post:req.body.post,userId:req.body.userId});
    newPost.save((err,data)=>{
        if(err){
            res.status(403).send({success:false,msg:'cannot post your data'});
        }
        else{
            res.status(200).send({success:true,msg:'posted your data successfully'});
        }
    });
});

app.put('/postcomment',(req,res)=>{
    console.log(req.body.user);
    MongoModel.findOne({email:req.body.user},(err,data)=>{
        if(data){
            let post;
            console.log(req.body.post);
            data.posts.forEach(element => {
                if(element.post==req.body.post){
                    console.log(data.posts);
                    //  data.posts.comments.push({"comment":"success adding comment","user":"admin"});
                    data.save(error=>{
                        return console.log('returned');
                    });
                }
            });
           return res.send({success:true,msg:"posted the comment successfully!"});
        }
        res.send({error:err})
    })
});



app.post('/register',(req,res)=>{
    newUser = new MongoModel({name:req.body.name,email:req.body.email,password:req.body.password,posts:req.body.posts});
    addUser(newUser,(err,user)=>{
        if(err) {
             res.send({success:false,msg:err}) 
             console.log('Failure');
             
            }
        else {
            res.send({success:true,msg:user});
            console.log('Success!');
            
        }
    });
});

app.post('/authenticate',(req,res)=>{
    const query = {email:req.body.email};
    MongoModel.findOne(query,(err,user)=>{
        if(!user){
            return res.status(403).send({success:false,msg:'invalid user'});
        }
        comparePassword(req.body.password,user.password,(err,ismatch)=>{
            const username = user.email;
            if(ismatch){
                jwtModel.findOne({username:username},(err,jwtuser)=>{
                    if(!jwtuser){
                        const token = jwt.sign({ data: user }, 'my secret key');
                        new jwtModel({ token: token, user: user, username:username }).save((err, token) => {
                            //console.log(token);

                        });
                        res.send({ success: true, token: token, email: username, msg: 'Logged in' });
                        
                    }
                    else{
                        res.send({ success: true,token: jwtuser.token, email: jwtuser.username, msg: 'Already Logged in' });
                        
                    }
                });
                // const token = jwt.sign({data:user},'my secret key');
                // new jwtModel({token:token,user:user}).save((err,token)=>{
                //         console.log(token);
                        
                // });
                //res.send({success:true,token:token,email:user.email, msg:'Logged in'});
                //res.send({msg:"Hi there"});
            }else{
                res.status(403).send({success:false,msg:'invalid password'});
            }
        });
        
    });
})

function comparePassword(userPass,password,callback){
    bcrypt.compare(userPass, password, function(err, resp) {
        if(err) console.log(err);
        else {
            callback(null,resp);
        }
        
    });
}


function addUser(addUser,callback){
    bcrypt.hash(addUser.password,10,(err,hash)=>{
        addUser.password = hash;
        addUser.save(callback);
        
    });
}



app.listen(8080,()=>{
    console.log('listening on 8080');
})