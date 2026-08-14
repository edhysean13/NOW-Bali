import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"}});
app.use(cors()); app.use(express.json()); app.use(express.static(path.join(__dirname,"public")));

const posts=[
 {id:crypto.randomUUID(),user:"Made Dharma",text:"Sunset gila hari ini!",place:"Canggu Beach",people:126,createdAt:Date.now()-120000},
 {id:crypto.randomUUID(),user:"Sara Kim",text:"Ramai banget malam ini 🔥",place:"Canggu Beach",people:126,createdAt:Date.now()-300000},
 {id:crypto.randomUUID(),user:"Gus Arya",text:"DJ mulai jam 10",place:"Canggu Beach",people:126,createdAt:Date.now()-480000}
];
const places=[
 {id:"canggu",name:"Canggu Beach",lat:-8.6478,lng:115.1385,people:126,posts:38},
 {id:"seminyak",name:"Seminyak",lat:-8.6913,lng:115.1687,people:74,posts:22},
 {id:"kuta",name:"Kuta Beach",lat:-8.7186,lng:115.1686,people:61,posts:17}
];

function score(p){
 const freshness=Math.max(0,1-(Date.now()-p.createdAt)/86400000);
 return Math.min(100,Math.round(p.people*.45+p.posts*.8+freshness*10));
}
app.get("/api/places",(req,res)=>res.json(places.map(p=>({...p,score:score(p)}))));
app.get("/api/posts",(req,res)=>res.json(posts.slice().sort((a,b)=>b.createdAt-a.createdAt)));
app.post("/api/posts",(req,res)=>{
 const {user="Anonymous",text="",place="Canggu Beach"}=req.body;
 if(!text.trim()) return res.status(400).json({error:"text required"});
 const post={id:crypto.randomUUID(),user,text:text.trim(),place,people:1,createdAt:Date.now()};
 posts.unshift(post);
 const placeObj=places.find(x=>x.name===place); if(placeObj){placeObj.posts++;placeObj.people++;}
 io.emit("new_post",post);
 io.emit("places_updated",places);
 res.status(201).json(post);
});
io.on("connection",socket=>{
 socket.emit("hello",{message:"NOW realtime connected"});
 socket.on("join_place",place=>socket.join(place));
});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
server.listen(process.env.PORT||3000,()=>console.log("NOW BALI running on http://localhost:"+ (process.env.PORT||3000)));
