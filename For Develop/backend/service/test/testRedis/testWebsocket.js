const {io} = require("socket.io-client");
const {fork}=require('node:child_process');
const {resolve}=require('path');

let testCnt=0;
const socket=io('http://localhost:1234');

function runTest(){
	++testCnt;
	// console.log('Test #',testCnt);
	socket.emit('initActivity',{
		aid:5,
		seatMap:` \n sssssssssss\n sssssssssss\n sssssssssss`
	})
	setTimeout(()=>{
		let child=fork(resolve(__dirname,'testWebsocketWorker.js'));
		child.on('message',msg=>{
			// console.log(msg.suc);
			// setTimeout(()=>{
				child.kill();
				// console.log(msg);
				endTest(msg.suc);	
			// },20*1000);
		})
	},1000);
}

function endTest(suc){
	let res=[0,1].map(idx=>suc.reduce((val,ele)=>val+ele[idx],0)/33);
	console.log(...res);
	// console.log('Test end!')
	// console.log();
	if(testCnt==300){
		process.exit();
	}
	showResult=false;
	setTimeout(()=>{
		runTest()
	},1000)
}

socket.on('connect',()=>{
	runTest();
})