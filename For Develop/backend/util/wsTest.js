const {WebSocket}=require('ws');
const {baseURL}=require('../inc/setting.js');

function EventBus(total){
	this.connectNum=total;
	this.successCount=0;
	this.errorCount=0;
	this.startTime=new Date();
	this.firstRespond=null;
	this.lastRespond=null;
	this.response=new Array(total);
	this.addOne=function(success=true,i,res){
		this.response[i]=res;
		if(success)this.successCount++;
		else this.errorCount++;
		this.connectNum--;
		if(this.connectNum==total-1){
			this.firstRespond=new Date();
		}else if(this.connectNum==0){
			this.lastRespond=new Date();
			if(this.onfinish)this.onfinish();
		}
	}
}

const wsURL='ws://8.134.9.215:1234'
// const wsURL='ws://'+baseURL.replace('8080','1234');

function test1(total){
	async function makeOne(i){
		var ws=new WebSocket(wsURL,{
			handshakeTimeout:2000
		});
		var st=new Date();
		ws.on('open',()=>{
			e.addOne(true,i,new Date()-st);
			ws.close();
		})
		ws.on('error',()=>{
			e.addOne(false,i,0);
		})
	}
	var e=new EventBus(total);
	for(let i=0;i<total;i++){
		setTimeout(()=>makeOne(i),Math.random()*5000);
	}
	return new Promise((res,rej)=>{
		e.onfinish=function(){
			console.log('共用时： '+(e.lastRespond-e.startTime)+'ms');
			console.log('成功: '+e.successCount,'失败: '+e.errorCount);
			var avg=e.response.reduce((val,ele)=>val+ele,0)/total;
			console.log('平均用时： '+avg+' ms');
			res();
		}
	})
}

async function test2(total){
	var e=new EventBus(total,{
		handshakeTimeout:2000
	});
	async function makeOne(i){
		var w2=new WebSocket(wsURL);
		w2.on('open',()=>{
			w2.send("[1,2,3,2,"+i+"]");
			setTimeout(()=>{
				w2.send('["$$remove$$","",'+i+']');
			},1000)
			setTimeout(()=>{
				w2.close();
			},2000)
		})
		w2.on('message',(msg)=>{
			msg=JSON.parse(msg.toString());
			if(msg.length==0)return;
			else e.addOne(true,i,msg[4]);
			// console.log(msg);
		})
		w2.on('error',()=>{
			e.addOne(false,i,0);
		})
	}
	for(let i=0;i<total;i++){
		makeOne(i);
	}
	return new Promise((resolve)=>{
		e.onfinish=function(){
			console.log('共用时： '+(e.lastRespond-e.startTime)+'ms');
			console.log('成功: '+e.successCount,'失败: '+e.errorCount);
			// console.log(e.response);
			var res=[...new Set(e.response)];
			console.log(res);
			console.log(`${total}个人中，共有${res.length}个抢到了座位。`);
			if(res.length==1)console.log('测试通过');
			else console.log('测试不通过');
			resolve();
		}
	})
}

function delay(){
	for(var i=0;i<=100000;i++){;;}
	return
}

console.log('webSocket测试');
console.log('测试链接：',wsURL);
console.log();
console.log('测试一： 负荷量。');
console.log('Test#1 500');
test1(500).then(()=>{
	console.log('\nTest#2 1000');
	delay();
	return test1(1000);
}).then(()=>{
	console.log('\nTest#3 1500');
	delay();
	return test1(1500);
}).then(()=>{
	console.log('\nTest#4 2000');
	delay();
	return test1(2000);
}).then(()=>{
	console.log();
	console.log('测试二： 并发抢座。');
	delay();
	console.log('\nTest#1 10');
	return test2(10);
}).then(()=>{
	console.log('\nTest#2 40');
	delay();
	return test2(40);
}).then(()=>{
	console.log('\nTest#3 70');
	delay();
	return test2(70);
})


// console.log('测试二： 并发抢座。');
// 	console.log('\nTest#1 10');
// test2(10).then(()=>{
// 	console.log('\nTest#2 40');
// 	return test2(40);
// }).then(()=>{
// 	console.log('\nTest#3 70');
// 	return test2(70);
// })
// console.log('测试二： 并发抢座。');
// 	console.log('\nTest#1 10');
// 	return test2(10);
