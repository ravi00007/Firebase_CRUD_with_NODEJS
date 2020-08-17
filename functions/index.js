const functions = require('firebase-functions');
const express = require('express');
const admin=require('firebase-admin');
const cors = require('cors');
const expressLayouts=require('express-ejs-layouts');
const  { Storage } = require('@google-cloud/storage');
const bodyParser = require('body-parser');
const multer = require('multer');
const BusBoy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs")
var serviceAccount = require("../serviceAccountKey.json");
// const upload = require('./upload');  
// var upload = multer({ dest: 'upload/' })            
const app = express();

 
 


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-crud-restapi-ac1a1.firebaseio.com",
  storageBucket: "gs://fir-crud-restapi-ac1a1.appspot.com/"
}); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(cors({origin:true}));
const db=  admin.firestore();
app.use(expressLayouts);
app.set('view engine','ejs');
     
// const storage =  new Storage({
//    // projectId: "fir-crud-restapi-ac1a1",
//    keyFilename: "../serviceAccountKey.json"
//  });
 const bucketName = "gs://firr-crud-restapi-ac1a1.appspot.com"

//  let filename = 'file.txt'
//storage.bucket("gs://fir-crud-restapi-ac1a1.appspot.com")


const storage = multer.diskStorage({
   destination:function(req,file,cb){
       cb(null,"uploads")
   },
   filename:function(req,file,cb){
       cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));

   }
}) 

const upload = multer({
   storage:storage
})







app.post('/api/upload',upload.single('image'),(req,res)=>{
   console.log(req.file)

   // await storage.bucket(bucketName).upload(filename,{
   //    gzip:true,
   //    metadata:{
   //       cacheControl: 'public, max-age=31536000',
   //    }    
   // }) 
   // // uploadFile();
   // console.log(`${filename} uploaded to ${bucketName}.`);
});


// Routes
app.get('/hello',(req,res)=>{
    return res.status(200).send('its working fine');
})
// create
app.post('/api/create',(req,res)=>{
   (async()=>{

    try
    {
       await db.collection('products').doc('/' + req.body.id + '/')
       .add({
           name: req.body.name,
           description:req.body.description,
           price: req.body.price
       })

       return res.status(200).send();
    }
    catch (error)
    {
       console.log(error);
       return res.status(500).send(error)
    }

   })();
    
});


// read specific product based on id
app.get('/api/read/:id',(req,res)=>{
    (async()=>{
 
     try
     {
        const document = db.collection('products').doc(req.params.id);
        let product = await document.get();
        let response = product.data();
        return res.status(200).send(response);
     }
     catch (error)
     {
        console.log(error);
        return res.status(500).send(error)
     }
 
    })();
     
 });
 // read All product
app.get('/api/read',(req,res)=>{
    (async()=>{
 
     try
     {
            let query = db.collection('products');
            let response=[];
            await query.get().then(querySnapshot=>{
                let docs=querySnapshot.docs; // the result of the query
            
                for(let doc of docs)
                {
                    const selectedItems={
                        id:doc.id,
                        name:doc.data().name,
                        description:doc.data().description,
                        price:doc.data().price
                    };
                    response.push(selectedItems);
                }
                return response; // each then should retrun a value

            })
            return res.status(200).send(response);
     }
     catch (error)
     {
        console.log(error);
        return res.status(500).send(error)
     }
 
    })();
     
 });

// update
app.put('/api/update/:id',(req,res)=>{
    (async()=>{
 
     try
     {  
         const documnet = db.collection('products').doc(req.params.id)
         await documnet.update({
             name:req.body.name,
             description:req.body.description,
             price:req.body.price
         })
 
        return res.status(200).send();
     }
     catch (error)
     {
        console.log(error);
        return res.status(500).send(error)
     }
 
    })();
     
 });
// delete
app.delete('/api/delete/:id',(req,res)=>{
    (async()=>{
 
     try
     {  
         const documnet = db.collection('products').doc(req.params.id)
         await documnet.delete();   
 
        return res.status(200).send();
     }
     catch (error)
     {
        console.log(error);
        return res.status(500).send(error)
     }
 
    })();
     
 });
 app.get('/api/logout',(req,res)=>{
   res.sendFile(__dirname+'/login.html')
   })

 app.get('/api/login',(req,res)=>{
    
   res.sendFile(__dirname+'/login.html')
 })
 app.get('/api/reg',(req,res)=>{
    
   res.sendFile(__dirname+'/reg.html')

 })

 // REgistration
app.post('/api/reg',(req,res)=>{
let name = req.body.name
let email = req.body.email
let password=req.body.password
if (!name || !email || !password  ) {
   res.send('enter all field')
 }

 var userRef = admin.firestore().collection('products')
 var userExists
 userRef.where('email', '==', email).get()
 .then(snapshot => {
   userExists = snapshot.size;
   console.log(`user by eamil query size ${userExists}`);
   //send error if user exists
   if(userExists && userExists > 0){
      res.status(200).send("Account exists with same email Id.");
      return;
   }

   //add user to database
   admin.firestore().collection('products').add({
      name: name,
      email: email,
      password: password
   }).then(ref => {
      console.log('add user account', ref.id);
      res.sendFile(__dirname+'/login.html')
      // res.status(200).send("User account created.");
      console.log('user account created')
      
      return;	
   });      	   	

})
})
 app.post('/api/login',(req,res)=>{
    let password = req.body.password
    let email = req.body.email
   var userRef = admin.firestore().collection('products')
   userRef.where('email', '==', email).get()
   .then(snapshot => { 
      if(snapshot.size > 1){
         res.status(200).send("Invalid account.");
         return;
      }
      snapshot.forEach(doc => {
         console.log(doc.id, '=>', doc.data().name);
         var userPass = doc.data().password;

         //if password matches, generate token, save it in db and send it
         if(userPass && password == userPass){
           res.sendFile(__dirname+'/dashbord.html')
         }else{
            res.status(200).send("Invalid email/password.");
         }
      });
   })
 })

app.get('/api/upload',(req,res)=>{
   res.sendFile(__dirname+'/upload.html')
})


const uploadFile = async() => {

   // Uploads a local file to the bucket
   await storage.bucket(bucketName).upload(filename, {
       // Support for HTTP requests made with `Accept-Encoding: gzip`
       gzip: true,
       // By setting the option `destination`, you can change the name of the
       // object you are uploading to a bucket.
       metadata: {
           // Enable long-lived HTTP caching headers
           // Use only if the contents of the file will never change
           // (If the contents will change, use cacheControl: 'no-cache')
           cacheControl: 'public, max-age=31536000',
       },
});

console.log(`${filename} uploaded to ${bucketName}.`);
}
// export the api to firebase cloud functions
exports.app=functions.https.onRequest(app);





