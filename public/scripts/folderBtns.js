const del = document.getElementById('deleteButton');
const delIcon = document.getElementById('deleteIcon');
const newBtn = document.getElementById('newFolder');
const newFile = document.getElementById('upFile');
const create = document.getElementById('create');
const share = document.getElementById('send');
const shareForm = document.getElementById('shareForm');
const shareBtn = document.getElementById('share');

const dismiss = document.querySelectorAll('.dismiss');
const input = document.querySelectorAll('input');
const over = document.getElementById('folderOverlay');
const fileOver = document.getElementById('fileOverlay');
const shareOver = document.getElementById('shareOverlay');
const cont = document.querySelector('.form-container');

newFile ? newFile.addEventListener('click',()=>{
    fileOver.classList.remove('hidden');
}): null

fileOver ? fileOver.addEventListener('click',()=>{
    fileOver.classList.add('hidden');
}): null

newBtn ? newBtn.addEventListener('click', ()=>{
    over.classList.remove('hidden');
}): null

over ? over.addEventListener('click',()=>{
    over.classList.add('hidden');
}): null

shareBtn ? shareBtn.addEventListener('click',()=>{
    shareOver.classList.remove('hidden');
}): null

input ? input.forEach(item=>{
    item.addEventListener('click',(e)=>{
    e.stopPropagation();
    })
}): null

dismiss ? dismiss.forEach(item=>{
    item.addEventListener('click',()=>{
        over.classList.add('hidden');
        fileOver.classList.add('hidden');
        shareOver.classList.add('hidden');
    });
}): null

const handleDelete = async()=>{
    let toDelete;
    let url;
    let requestBody;
    let msg;
    const parentFolder = del.dataset.parent
    if(del.dataset.folder){
        toDelete = del.dataset.folder;
        url="/delete_folder/"+toDelete;
        requestBody=JSON.stringify({folder:toDelete,parentFolder:parentFolder});
        msg="Do you want to delete this folder and all of its elements?"
        
    }
    else{
        toDelete = del.dataset.file;
        url="/delete_file/"+toDelete;
        requestBody=JSON.stringify({file:toDelete,parentFolder:parentFolder});
        msg="Do you want to delete this file?"
    }
    if(confirm(msg)){
        const res = await fetch(url,
            {method:"DELETE",
            headers:{"Content-Type":"application/json"},
            body:requestBody
        });
        if(res.ok){
            const data = await res.json();
            window.location.href=data.redirect;
        }
    }
}

 share ? share.addEventListener('click',async()=>{
    const folderId=shareForm.dataset.folder;
    const userId=shareForm.dataset.user;
    const durationInput = shareForm.querySelector('input[name="duration"]');

    const res = await fetch('/user/'+userId+'/folders/'+folderId+'/share',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({duration:durationInput.value})
    });

    const json = await res.json();
    console.log(json.link);
    shareForm.innerHTML="";
    const p1 = document.createElement('p');
    p1.textContent="Here's your shared folder link:";
    const p2 = document.createElement('p');
    p2.textContent=json.link;
    shareForm.append(p1,p2);
    const div1 = document.createElement('div');
    div1.classList.add('btns');
    const btn1 = document.createElement('button');
    btn1.addEventListener('click',()=>{
        shareOver.classList.add('hidden');
    })
    btn1.textContent="Dismiss";
    btn1.type="button";
    btn1.classList.add('dismiss');
    div1.append(btn1);
    shareForm.append(div1);
}):null

let mobile = window.matchMedia("(max-width: 590px)");
const changeIcon = (query)=>{
    if(del && delIcon){
        if(query.matches){
            del.style.display='none';
            delIcon.style.display='block';
        }else{
            del.style.display='block';
            delIcon.style.display='none';
        }
    }
    
}

changeIcon(mobile);
mobile.addEventListener('change',()=>changeIcon(mobile));

del ? del.addEventListener('click',handleDelete):null;
delIcon ? delIcon.addEventListener('click',handleDelete):null;
