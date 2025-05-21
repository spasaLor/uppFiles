const {body, validationResult} = require("express-validator");
const{PrismaClient} = require("../generated/prisma");
const bcrypt = require("bcrypt");
const {v2} = require('cloudinary');
const {format,addDays,isAfter} = require('date-fns');
const {randomUUID} = require('crypto');

registrationValidator=[
    body("username").trim().isLength({min:5}).withMessage("Username must be at least 5 characters long")
    .matches(/^[a-zA-Z0-9-_]+$/).withMessage("Username can contain only letters, numbers and hyphens like '-' and '_'"),
    body("password").trim().isLength({min:6}).withMessage("Password must be at least 6 characters long")
    .matches(/^[a-zA-Z0-9\-_$&%]+$/).withMessage("Special characters allowed in passwords are '-', '_', '$', '&', and '%'"),
    body("confirm").custom((value, {req})=>value === req.body.password).withMessage("Passwords don't match")
];

const prisma=new PrismaClient();
v2.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:Number(process.env.CLOUDINARY_API_KEY),
    api_secret:process.env.CLOUDINARY_API_SECRET,
})

const registrationFormPost = [registrationValidator, async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty())
        return res.render("registration",{title:"Registration",errors:errors.array()});

    const data = req.body;
    const hashed = await bcrypt.hash(data.password,10);

    try {
        await prisma.users.create({
        data:{
            username:data.username,
            password:hashed,
            folders:{
                create:{name:data.username+"'s root folder"}
            }
        }
    });
    } catch (error) {
        return res.render("registration",{title:"Registration",errors:[{message:"Username already exists, try another one!"}]});
    }
    const usr=await prisma.users.findUnique({
        where:{
            username:data.username
        },
        include:{folders:true}
    })
    console.log(usr);
    res.redirect("/login");
}];

const loadUserFolder = async(req,res)=>{
    const{userId,folderId}=req.params;
    let folder;

    if(Number(userId) !== req.user.id)
        throw new Error("You don't have the permissions to visit this folder. Ask the owner for a shared link.");

    if(Number(folderId)){
        folder = await prisma.folders.findFirst({
        where:{
            id:Number(folderId),
            owner_id:req.user.id,
        },
        include:{files:true}
    });
    }else{
        folder=await prisma.folders.findFirst({
        where:{
            AND:[
                {owner_id:req.user.id},
                {name:{contains:'root'}}
            ]
        },
        include:{files:true}
    });
    }  

    const nested = await prisma.folders.findMany({
        where:{
            parent_folder_id:folder.id
        }
    });

    res.render("folderView",{title:folder.name,files:folder.files,childrenFolders:nested,current:folder});
}

const showFileProperties = async(req,res)=>{
    const {i,o,fileId} = req.params;
    const file= await prisma.files.findFirst({
        where:{
                id:Number(fileId),
                owner_id:req.user.id
        }
    });
    file.upload_time=format(file.upload_time,'dd/MM/yyyy HH:mm');
    res.render("fileProperties",{file:file});
}

const createFolder = async(req,res)=>{
    const {folderName,current} = req.body;
    await prisma.folders.create({
        data:{
            name:folderName,
            owner_id:Number(req.user.id),
            parent_folder_id:Number(current)
        }
    })
    res.redirect("/user/"+req.user.id+"/folders/"+current);
};

const shareFolder = async(req,res)=>{
    const {userId,folderId}= req.params;
    const {duration} = req.body;
    const created = new Date();
    const expires = (addDays(new Date(),Number(duration)));
    const id = randomUUID().slice(0,14);
    try {
        await prisma.shared_links.create({
        data:{
            id:id,
            folder_id:Number(folderId),
            created_at:created,
            expires_at:expires
        }
    });
    } catch (error) {
        console.log(error)
    }
    
    res.status(200).json({link:"/folders/shared/"+id});
}

const loadShared = async(req,res)=>{
    const {folderId} = req.params;
    let nested;
    const query= await prisma.shared_links.findUnique({
        where:{
            id:folderId
        },
        include:{folders:true}
    });

    const now = new Date();
    if(!isAfter(now,query.expires_at)){
        throw new Error("This shared link has expired, contact the owner of the folder for a new one.");
    }

    const trueFolder = query.folders;
    const files = await prisma.files.findMany({
        where:{
            folder_id:Number(trueFolder.id)
        }
    })

    if(trueFolder.id === null){
        nested = await prisma.folders.findMany({
        where:{
            parent_folder_id:null,
        }
        });
    }else{
        nested = await prisma.folders.findMany({
        where:{
            parent_folder_id:Number(trueFolder.id)
        }
    });
    }
    res.render("folderView",{title:trueFolder.name+" (Shared view)",files:files,current:trueFolder,childrenFolders:nested,sharedView:true});
}

const deleteFolder= async(req,res)=>{
    const {folder,parentFolder} = req.body;
    await prisma.folders.delete({
        where:{
            id:Number(folder)
        }
    })
    res.status(200).json({redirect: "/user/"+req.user.id+"/folders/"+parentFolder});
}

const deleteFile= async(req,res)=>{
    const {file,parentFolder} = req.body;
    await prisma.files.delete({
        where:{
            id:Number(file)
        }
    })
    res.status(200).json({redirect: "/user/"+req.user.id+"/folders/"+parentFolder});
}

const uploadFile = async (req,res)=>{
    const fileData=req.file;
    const{userId,folderId} = req.params;
    const uploadRes = await v2.uploader.upload(fileData.path)
    .catch((error)=>{
        console.log(error);
    });
    
    await prisma.files.create({
        data:{
            name:fileData.originalname,
            url:uploadRes.url,
            size:(fileData.size / (1024 * 1024)).toFixed(2) ,
            owner_id:Number(req.user.id),
            folder_id:Number(folderId),
            upload_time: new Date()
        }
    })

    res.redirect("/user/"+req.user.id+"/folders/"+folderId);
}
module.exports={registrationFormPost,loadUserFolder,showFileProperties,createFolder,loadShared,shareFolder,deleteFolder,uploadFile,deleteFile};