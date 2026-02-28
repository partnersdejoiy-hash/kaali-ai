
let history=[

{
role:"assistant",
content:"✨ Namaste. I am KAALI — your mystical guide at DEJOIY. I help you shop smarter, track orders and discover the best products. How may I assist you today?"
}

];

let lastReply="";

let box=document.getElementById("messages");

box.innerHTML=`

<div class='kaali'>
✨ Namaste. I am KAALI — your mystical guide at DEJOIY.<br>
How may I assist you today?
</div>

`;



async function send(){

let input=document.getElementById("input");

let msg=input.value.trim();

if(!msg)return;

input.value="";

box.innerHTML+=`

<div class='user'>
${msg}
</div>

`;

history.push({role:"user",content:msg});


box.innerHTML+=`

<div class='kaali'>
KAALI is thinking...
</div>

`;

box.scrollTop=box.scrollHeight;


let res=await fetch("/api/chat",{

method:"POST",
headers:{"Content-Type":"application/json"},

body:JSON.stringify({messages:history})

});


let data=await res.json();


box.removeChild(box.lastChild);


history.push({role:"assistant",content:data.reply});


lastReply=data.reply;


/* MAKE LINKS CLICKABLE */

let reply=data.reply
.replace(/https:\/\/[^\s]+/g,
url=>`<a href="${url}" target="_blank">Open Page</a>`);



box.innerHTML+=`

<div class='kaali'>

${reply}

</div>

`;


box.scrollTop=box.scrollHeight;

}


/* ENTER SUPPORT */

document.getElementById("input")
.addEventListener("keydown",

e=>{
if(e.key==="Enter")send();

});


/* GODDESS VOICE */

function speakLast(){

let text=lastReply
.replace(/[✨🔮📦🛒😊⭐]/g,'');

let voice=new SpeechSynthesisUtterance(text);

let voices=speechSynthesis.getVoices();

/* FEMALE VOICE */

voice.voice=voices.find(v=>
v.name.includes("Female")
)||voices[1];


voice.pitch=1.2;
voice.rate=0.9;


speechSynthesis.speak(voice);

}



/* VOICE RECORDING */

function startVoice(){

let rec=new webkitSpeechRecognition();

rec.lang="en-IN";

rec.onresult=e=>{

document.getElementById("input")
.value=e.results[0][0].transcript;

send();

};

rec.start();

}
