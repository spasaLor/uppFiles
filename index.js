const express = require('express');
const session = require('express-session');
const path = require("node:path");
require('dotenv').config();
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('./generated/prisma');
const passport = require("./config/passportConfig");
const controller = require("./controllers/projectController");
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' })

const isAuthenticated = (req,res,next)=>{
    if(req.isAuthenticated())
        next();
    else
        return res.redirect("/login");
}

const app = express();
app.set("view engine","ejs");
app.set('views',path.join(__dirname,'views'));

app.use(
  session({
    cookie: {
     maxAge: 7 * 24 * 60 * 60 * 1000 
    },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(
      new PrismaClient(),
      {
        checkPeriod: 2 * 60 * 1000, 
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      }
    )
  })
);

app.use(express.static('public'));
app.use(express.urlencoded({extended:false}))
app.use(express.json());
app.use(passport.session());
app.use((req,res,next)=>{
    res.locals.currentUser=req.user;
    next();
});
app.get("/",(req,res)=>{
    res.render("home");
})
app.get("/register",(req,res)=>{
    res.render("registration", {title:"Registration"});
});
app.post("/register",controller.registrationFormPost);

app.get("/login",(req,res)=>{
    res.render("login",{title:"Login"})
})
app.post("/login",(req,res,next)=>{
    passport.authenticate("local",(err,user,info)=>{
        if(err)
            return next(err);
        if(!user)
            return res.render("login",{title:"Login",errors:[{msg:"Invalid credentials"}]});
        req.logIn(user,(err)=>{
            if(err)
                return next(err)
            return res.redirect("/user/"+req.user.id+"/folders");
        });
    })(req,res,next);
});


app.get("/folders/shared/:folderId",controller.loadShared)
app.get("/user/:userId/folders/", isAuthenticated,controller.loadUserFolder);
app.post("/user/:userId/folders/create",isAuthenticated,controller.createFolder);
app.get("/user/:userId/folders/:folderId", isAuthenticated,controller.loadUserFolder);
app.post("/user/:userId/folders/:folderId/share",isAuthenticated, controller.shareFolder);
app.get("/user/:userId/folders/:folderId/files/:fileId", isAuthenticated,controller.showFileProperties);
app.post("/user/:userId/folders/:folderId/upload_file",upload.single('file'),controller.uploadFile);
app.delete("/delete_folder/:folderId",isAuthenticated,controller.deleteFolder);
app.delete("/delete_file/:fileId",isAuthenticated,controller.deleteFile);
app.get("/logout",(req,res,next)=>{
    req.logOut((err=>{
        if(err)
           return next(err);
    }));
    res.redirect("/login");
})
app.use((err,req,res,next)=>{
    res.render("error",{error:err});
})
app.listen(8080);
