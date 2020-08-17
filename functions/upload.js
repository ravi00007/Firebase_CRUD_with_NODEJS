const multer = require('multer');

const storage =   multer.diskStorage({
    destination: function(req,file,cb){
       cb(null,'./uploades')  
    },
    filename: function(req,file,cb){
       cb(null,new Date().toISOString() + '-' + file.originalname)
    }
 })
 
 const filefilter =(req,file,cb)=>{
    if(file.mimetye==='image/jpeg' || file.mimetye==='image/png'){
       cb(null,true)
    }
    else{
       cb({message:"unsupported file type"},false)
    }
 }
 const upload = multer({
    storage:storage,
    limits:{fileSize:1024*1024},
    fileFilter:filefilter
 })
 
 module.exports=upload;
 