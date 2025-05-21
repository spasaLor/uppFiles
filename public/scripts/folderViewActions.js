const folders = document.querySelectorAll('.folder-item');
const files = document.querySelectorAll('.file-item');
const form = document.querySelector('form');
const newFolder = document.getElementById('folderName');

folders.forEach(item=>{
    item.addEventListener('click',()=>{
        const id = item.dataset.folder;
        const user = item.dataset.user;
        window.location.href="/user/"+user+"/folders/"+id;
    })
});

files.forEach(item=>{
    item.addEventListener('click',()=>{
        const id = item.dataset.file;
        const user = item.dataset.user;
        const folder = item.dataset.folder;
        window.location.href="/user/"+user+"/folders/"+folder+"/files/"+id;
    })
});

form.addEventListener('submit',(e)=>{
    const val = newFolder.value.toLowerCase();
    if(val.includes("root")){
        e.preventDefault();
        alert("Folder names can't contain 'root'");
    }
    if(val.length < 5){
        e.preventDefault();
        alert("Folder names must be least 5 characters long");
    }
});

