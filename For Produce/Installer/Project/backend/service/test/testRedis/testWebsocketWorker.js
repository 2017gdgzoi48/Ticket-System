const { io } = require("socket.io-client");

const URL = process.env.URL || "http://localhost:1234";
const MAX_CLIENTS = 100000;
const POLLING_PERCENTAGE = 0.05;
const CLIENT_CREATION_INTERVAL_IN_MS = 1;
const EMIT_INTERVAL_IN_MS = 1;
const TOTAL_SEAT=33;

let clientCount=0;
let suc=[],showResult=true;
let sended={};

function createClient(){
// for demonstration purposes, some clients stay stuck in HTTP long-polling
	if(clientCount>MAX_CLIENTS)return;
	const socket=io(URL,{transports:["websocket","polling"]});
	let id=Math.round(Math.random()*10000000).toString(16);
	let ha1=setInterval(()=>{
		let col=Math.ceil(Math.random()*11),row=Math.ceil(Math.random()*3);
		// sended[`${col}-${row}`]=true;
		socket.emit('changeSeatMapFromClient',{
			fromId:id,
			opr:{
				row,
				col,
				aid:5,
				status:'c',
				kind:'choose',
				begin:new Date()
			}
		})
	},EMIT_INTERVAL_IN_MS);
	socket.on("changeSeatMap",res=>{
		if(!res)return;
		suc.push(...res.map(opr=>{
			if(opr.toId==id)return [
				new Date()-new Date(opr.begin),
				new Date(opr.end2)-new Date(opr.begin2),
				new Date(opr.end3)-new Date(opr.begin3)];
			// key=opr.row+'-'+opr.col;
			// if(!sended[key]){
			// 	sended[key]=1;
			// 	return new Date()-new Date(opr.begin);
			// }
			return null
		}).filter(Boolean));
		// suc=[...new Set(suc)];
		// console.log(suc,Object.keys(sended).length);
		if(suc.length>TOTAL_SEAT)console.log('fuck!!');
		if(suc.length>=TOTAL_SEAT&&showResult){
			showResult=false;
			// console.log(suc)
			process.send({suc});
		}
	});
	// socket.emit('ping');
	// socket.on('pong',sid=>{
	// 	// console.log(sid);
	// })
	socket.on("disconnect",reason=>{
		// console.log(`disconnect due to ${reason}`);
		--clientCount;
	});
	if(++clientCount<MAX_CLIENTS){
		setTimeout(createClient,CLIENT_CREATION_INTERVAL_IN_MS);
	}
}

createClient();