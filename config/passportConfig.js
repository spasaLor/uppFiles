const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const {PrismaClient} = require("../generated/prisma");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const strat = new LocalStrategy(async(username,password,done)=>{
    const user = await prisma.users.findUnique({
        where:{
            username:username,
        }
    });
    if(!user)
        return done(null,false,{message:"User not found"});
    const match = bcrypt.compare(password,user.password);
    if(!match)
        return done(null,false,{message:"Incorrect Password"});
    
    return done(null,user);
})

passport.use(strat);

passport.serializeUser((user,done)=>{
    done(null,user.id);
});
passport.deserializeUser(async(id,done)=>{
    const user = await prisma.users.findUnique({
        where:{
            id:id
        }
    });
    if (user)
        done(null,user);
})

module.exports=passport;