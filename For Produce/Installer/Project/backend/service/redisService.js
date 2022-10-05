const DataService=require('./dataService.js');
// const heapdump = require('heapdump');

let lockName=(aid,idx)=>`lock:${aid}-${idx}`;
let seatMapName=(aid)=>`seatMap:${aid}`;

const waiterStatus={
	'waiting':0, //等待锁中
	'fighting':1, //抢锁中
	'using':2, //操作中
	'unlocking':3, //解锁中
	'dead':4 //结束了
}

let delay=(t)=>new Promise(res=>setTimeout(()=>res(),t));

class LockWaiter{
	constructor(rs,listenForLock,{aid,idx},opr,cb=()=>{}){
		// if(opr.fromId==1)console.log(new Date());
		opr.begin3=new Date();
		// console.log((new Date()).getTime());
		this.rs=rs;
		this.client=rs.client;
		this.wid=Math.round(Math.random()*10000000).toString(16);
		this.idx=idx;
		this.lockName=lockName(aid,idx);
		this.seatMapName=seatMapName(aid);
		listenForLock((msg)=>{
			if(this.status>=waiterStatus.using)return; //等连接上的时候都已经拿到锁了哈哈
			if(msg==this.lockName&&this.status==waiterStatus.waiting){
				this.tryLock();
			}
		});
		this.oprList=[opr];
		this.status=waiterStatus.waiting;
		this.callback=cb;
		this.tryLock();
	}
	collect(opr){
		if(this.status>waiterStatus.fighting||!this.oprList)return null;
		// console.log('collect!');
		this.oprList.push(opr);
		return true;
	}
	doAction(map,oprList){
		// console.log(oprList);
		const validate={
			'sc':'choose',
			'cs':'cancelChoose',
			'cb':'buyTicket',
			'bs':'returnTicket',
			'sb':'round2Buy'
		}
		oprList=oprList.filter(opr=>{
			if(opr.row!=this.idx)return false;
			if(!map||!map[opr.col])return false;
			let char=map[opr.col];
			if(validate[char+opr.status]&&validate[char+opr.status]==opr.kind){
				map=map.slice(0,opr.col)+opr.status+map.slice(opr.col+1);
				// console.log('update!');
				return true;
			}
			else return false;
		})
		return [map,oprList];
	}
	async tryLock(){
		// if(this.oprList[0].fromId==1)console.log(new Date());
		this.status=waiterStatus.fighting;
		// console.log(this.rs);
		// await delay(1000);
		let result=await this.rs.tryGetLock(this.lockName,this.wid);
		// this.status=waiterStatus.locking;
		// if(this.oprList[0].fromId==1)console.log(new Date());
		if(result){
			let temp=[...this.oprList];
			delete this.oprList;
			this.status=waiterStatus.using;
			let row=await this.client.lIndex(this.seatMapName,this.idx),successList;
			await this.client.expire(this.lockName,2); //给锁续期(WatchDog)
			[row,successList]=this.doAction(row,temp);
			let wid=await this.client.get(this.lockName);
			if(wid==this.wid){
				await this.client.lSet(this.seatMapName,this.idx,row);
				this.unlock(successList);
			}else{
				this.end([]);
			}
		}
		else this.status=waiterStatus.waiting;
	}
	async unlock(successList){
		this.status=waiterStatus.unlocking;
		let wid=await this.client.get(this.lockName);
		if(wid==this.wid){
			await this.client.del(this.lockName);
			await this.client.publish('locker',this.lockName);
			this.end(successList);	
		}else{
			this.end(successList)
		}
	}
	end(successList){
		this.status=waiterStatus.dead;
		delete this.rs;
		delete this.client;
		// delete this.wid;
		// delete this.seatMapName;
		// delete this.lockName;
		// delete this.idx;
		
		// this.oprList.map(opr=>{
		// 	console.log(new Date()-opr.begin3);
		// })
		this.callback(successList.map(ele=>{
			ele.end3=new Date();
			return ele;
		}));
		// console.log(this.oprList.map(opr=>new Date()-opr.begin).join('\n'));
	}
}

class WaiterList{
	constructor(rc){
		this.list={};
		this.subscriber=rc.duplicate();
		this.subscriber.connect().then(()=>{
			this.subscriber.subscribe('locker',msg=>{
				let temp=this.handlers;
				temp.forEach(({handler})=>handler(msg));
			})
		});
		this.handlers=[];
		this.on=(handler,wid)=>{
			this.handlers.push({wid,handler});
		}
		this.off=(targetWid)=>{
			this.handlers=this.handlers.filter(({wid})=>wid!==targetWid);
		}
	}
	requestWaiter(rs,opt,opr,cb){
		let keyName=lockName(opt.aid,opt.idx);
		if(!this.list[keyName])return this.createWaiter(keyName,rs,opt,opr,cb);
		this.clearOld(keyName);
		let waiter=this.list[keyName][0];
		if(!waiter)return this.createWaiter(keyName,rs,opt,opr,cb);
		opr.begin3=new Date();
		waiter.collect(opr);
	}
	createWaiter(keyName,rs,opt,opr,cb){
		// console.log(keyName);
		let arr=this.list[keyName];
		arr=arr??[];
		arr.push(new LockWaiter(rs,this.on,opt,opr,cb));
		this.list[keyName]=arr;
	}
	clearOld(keyName){
		this.list[keyName]=this.list[keyName].filter(waiter=>{
			if(waiter.status>waiterStatus.fighting||!waiter.oprList){
				this.off(waiter.wid);
				return null;
			}
			return true;
		});
	}
}

function RedisService(){
	let ds=new DataService();
	let client=ds.fromRedis();
	ds.end();
	client.connect().then(()=>{
		this.client=client;
		delete client;
		this.waiterList=new WaiterList(this.client);
		setTimeout(()=>{
			this.onready();
		},500);
	});
	this.onready=function(){};
}

RedisService.prototype.initActivity=async function(aid,seatMap){
	let client=this.client;
	let strArr=seatMap.split('\n');
	for(let i=1;i<strArr.length;i++){
		await client.del(lockName(aid,i));
	}
	await client.del(seatMapName(aid));
	// console.log(strArr);
	await client.rPush(seatMapName(aid),strArr);
	return true;
}

RedisService.prototype.deleteActivity=async function(aid){
	await this.client.del(seatMapName(aid));
	return true;
}

RedisService.prototype.tryGetLock=async function(keyName,wid){
	let client=this.client;
	let result=await client.set(keyName,wid,{EX:3,NX:true});
	if(result==0)return false;
	else return true;
}

RedisService.prototype.changeSeatMap=function(opt,opr,cb){
	this.waiterList.requestWaiter(this,opt,opr,cb);
}
RedisService.prototype.getSeatMap=async function(aid){
	let map=await this.client.lRange(seatMapName(aid),0,-1);
	return map.join('\n');
}

RedisService.prototype.end=function(){
	// this.client.quit();
	// console.log('what???');
	this.client.disconnect();
	// delete this.client;
	return;
}

let cnt=0;
process.on('uncaughtException',err=>{
	console.log(err,++cnt);
});
module.exports=RedisService;

// let cnt1=0;
// setInterval(()=>{
// 	heapdump.writeSnapshot((++cnt1)+'.heapsnapshot',err=>{
// 		console.log(err);
// 	});
// },60*1000)

// let rs=new RedisService();
// rs.onready=()=>{
// 	rs.changeSeatMap({aid:5,idx:3},{row:3,col:3,kind:'buyTicket',status:'b',aid:5},(c)=>{
// 		console.log(c);
// 	});
// }
// rs.initActivity(5,str);
	// rs.getSeatMap(5).then(res=>{
	// 	console.log(res);
	// 	rs.end();
	// })

