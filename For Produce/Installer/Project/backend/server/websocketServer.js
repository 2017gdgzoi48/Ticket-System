const RedisService=require('../service/redisService.js');
const {wsPort}=require('../inc/setting.js');
const {createClient}=require('redis');
const {Server}=require("socket.io");
const {createServer}=require("http");
const {createAdapter}=require("@socket.io/redis-adapter");

const rs=new RedisService();
const server=createServer();
const io=new Server(server,{
  cors: {
    origin: "*"
  }
});
const test=false;
// io.adapter(createAdapter());
// console.log(process.env)
class WatchDog{
	constructor(){
		this.list={};
		this.socketList={};
	}
	regist(id,sid){
		if(!sid||!id)return;
		this.socketList[sid]=id;
		console.log('[regist]',id,sid);
	}
	unregist(sid){
		delete this.socketList[sid];
	}
	watch(opr){
		// this.list[tag]=opr;
		let tag=`${opr.toId}-${opr.aid}-${opr.row}-${opr.col}`;
		opr.kind='cancelChoose';
		opr.status='s';
		this.list[tag]=opr;
	}
	bark(sid){
		console.log('[bark]barking at',sid);
		let cnt=0;
		let oprList=Object.entries(this.list).filter(ele=>{
			return ele[0].startsWith(sid+'');
		}).map(ele=>ele[1]);
		// console.log('oprList',oprList);
		if(!oprList.length)return;
		let handle=setInterval(async ()=>{
			let ok=false;
			if(this.socketList[sid]){
				ok=await io.in(this.socketList[sid]).fetchSockets();
				ok=ok.length;
			}
			// console.log(ok);
			if(!ok){
				cnt++;
				delete this.socketList[sid];
			}
			else{
				let socket=await io.in(this.socketList[sid]).fetchSockets();
				setTimeout(()=>{
					console.log('[call]',sid);
					socket[0].emit('changeSeatMap',oprList.map(opr=>{
						opr.kind='choose';
						opr.status='c';
						return opr;
					}));
				},100)
				clearInterval(handle);
			}
			if(cnt==20){
				console.log('[delete]',sid);
				oprList.forEach(opr=>this.clear(opr));
				clearInterval(handle);
			}
		},100);
	}
	cancel(opr){
		let tag=`${opr.toId}-${opr.aid}-${opr.row}-${opr.col}`;
		delete this.list[tag];
	}
	clear(opr){
		let {aid,row:idx}=opr;
		rs.changeSeatMap({aid,idx},opr,handleCallback);
	}
}

async function initRedisAdapater(){
	const pubClient=createClient();
	const subClient=pubClient.duplicate();
	return Promise.all([pubClient.connect(),subClient.connect()]).then(()=>{
		io.adapter(createAdapter(pubClient,subClient));
		return io;
	});
}
const wg=new WatchDog();

function handleCallback(res){
	if(res.length==0)return;
	console.log(res);
	res=res.map(opr=>{
		opr.end2=new Date();
		if(!test){
			let temp={...opr}
			if(opr.kind=='choose')wg.watch(temp);
			else wg.cancel(temp);
		}
		return opr;
	})
	// console.log(res);
	io.emit('changeSeatMap',res);
}

initRedisAdapater().then(io=>{
	let offset=Number(process.env.NODE_APP_INSTANCE ?? 0);
	server.listen(wsPort+offset+1);
	io.on('connection',socket=>{
		// socket.on('registId',sid=>{
		// 	socket.data.sid=sid;
		// 	wg.regist(socket.id,sid);
		// })
		socket.on('initActivity',({aid,seatMap})=>{
			rs.initActivity(aid,seatMap);
		})
		socket.on('disconnect',()=>{
			if(!socket.data.sid)return;
			if(!test)wg.unregist(socket.data.sid);
			setTimeout(()=>{
				if(!test)wg.bark(socket.data.sid);
			},100)
		})
		socket.on('initSeatMapFromClient',({aid,sid})=>{
			if(sid){
				socket.data.sid=sid;
				wg.regist(socket.id,sid);
			}
			rs.getSeatMap(aid).then(seatMap=>{
				socket.emit('initSeatMap',seatMap);
			})
		})
		socket.on('changeSeatMapFromClient',data=>{
			console.log(data);
			let {fromId,opr}=data;
			opr.toId=fromId;
			opr.begin2=new Date();
			let {aid,row:idx}=opr;
			rs.changeSeatMap({aid,idx},opr,handleCallback);
		})
		socket.on('ping',()=>{
			io.emit('pong',offset)
		});
	})
})