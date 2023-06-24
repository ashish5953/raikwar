var express = require('express');
var router = express.Router();
var userModel = require('./users');
const passport = require('passport');
var localstrategy = require('passport-local');
var path = require("path");
var multer = require("multer");



passport.use(new localstrategy(userModel.authenticate()));


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    var dt = new Date();
    var fn = dt.getTime() + Math.floor(Math.random()*1000000) + path.extname(file.originalname)
    cb(null, fn)
  }
})

function fileFilter (req, file, cb) {

  if(file.mimetype === "image/jpg" || file.mimetype === "image/png" || file.mimetype === "image/jpeg" || file.mimetype === "image/webp"){
    cb(null, true)
  }

  else{
  cb(new Error('dont walk fast'), false)

  }

}

const upload = multer({ storage: storage, fileFilter: fileFilter })

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.post('/register',function(req,res){
  var createduser = new userModel({
    username: req.body.username,
    email: req.body.email,
    number: req.body.number,
    image: req.body.image,
  })
  userModel.register(createduser, req.body.password)
  .then(function(){
    passport.authenticate('local')(req, res, function(){
      res.redirect('/profile')
    })
  })
});

router.post('/login',passport.authenticate('local',{
  successRedirect: '/profile',
  failureRedirect: '/'
}),function(req, res){});

router.get('/logout',function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.get('/profile',isloggedIn,function(req,res){
  const username = req.session.passport.user;
  userModel.findOne({username: req.session.passport.user})
  .then(function(founduser){
    res.render('profile',{user: founduser})
  })  
});

router.get('/feed',isloggedIn,function(req,res){
  userModel.find()
  .then(function(allusers){
    res.render("allusers" , {allusers})
  })
});

router.post('/uploads',isloggedIn, upload.single("dp") ,function(req,res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(loginuser){
    loginuser.image = req.file.filename;
    loginuser.save()
    .then(function(){
      res.redirect("/profile")
    })
  })
})


router.get('/like/:id',isloggedIn,function(req,res){
  userModel.findOne({_id: req.params.id})
  .then(function(user){
    if(user.like.indexOf(req.session.passport.user) === -1){
      user.like.push(req.session.passport.user);
    }
    else{
      user.like.splice(user.like.indexOf(req.session.passport.user), 1)
    }    
    user.save()
    .then(function(){
      res.redirect('back')
    })
  })
});

router.get('/username/:username',function(req, res){
  userModel.findOne({username: req.params.username})
  .then(function(founduser){
    if(founduser){
      res.json({found: true})
    }
    else{
      res.json({found: false})
    }
  })
})

function isloggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next()
  }
  else res.redirect('/')
}
module.exports = router;
