const fs = require('fs');
const https = require ('https');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const {Strategy} = require('passport-google-oauth20');

const passport = require('passport');
const cookieSession = require('cookie-session');

require('dotenv').config();

const PORT = 3000;

const app = express();

const config = {
    CLIENT_ID:process.env.CLIENT_ID,
    CLIENT_SECRET:process.env.CLIENT_SECRET,
    COOKIE_KEY_1:process.env.COOKIE_KEY_1,
    COOKIE_KEY_2:process.env.COOKIE_KEY_2,
}

const AUTH_OPTIONS = {
    callbackURL:'/auth/google/callback',
    clientID:config.CLIENT_ID,
    clientSecret:config.CLIENT_SECRET,
};

function verifyCallback(accessToken, refreshToken,profile,done){
    console.log('Google Profile ',profile);
    done(null,profile);
}

passport.use(new Strategy(AUTH_OPTIONS,verifyCallback))
//Save the session to cookie
passport.serializeUser((user,done)=>{
    done(null,user.id);
});
//Read the session to cookie
passport.deserializeUser((obj,done)=>{
    User.findbyId(id).then(user =>{
        done(null,obj);
    })
   
});
app.use(helmet());
app.use(cookieSession({
    name:'session',
    maxAge:24*3600*1000,
    keys:[config.COOKIE_KEY_1, config.COOKIE_KEY_2],
}));
app.use(passport.initialize());
app.use(passport.session());


function checkLoggedIn(req,res,next){
    console.log('Current user is',req.user);
    const isLoggedIn = req.user;
    if (!isLoggedIn) {
        return res.status(401).json({
            error:'You must log in',
        });
    }
    next();
}

app.get('/auth/google',passport.authenticate('google',{
    scope:['email'],
}));

app.get('/auth/google/callback', 
    passport.authenticate('google',{
        failureRedirect:'/failure',
        sucessRedirect:'/',
        session:true,
}),(req,res)=> {
    console.log('Ggl called!');
});

app.get('/auth/logout',(req,res)=>{
    req.logout();
    return res.redirect('/');
})

app.get('/secret',checkLoggedIn,(req,res)=>{
    return res.send('Your personel value is 42');
});

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','index.html'));
});

app.get('/failure',(req,res)=>{
    return res.send('Failed to login');
});

https.createServer({
    key: fs.readFileSync('key.pem'),
    cert:fs.readFileSync('cert.pem'),

}, app).listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
}); 