const redisService=require('../../redisService.js');
const rs=new redisService();

const testData={
	targetInfo:{
		aid:5,
		idx:2
	},
	row:2,col:1
}
function Opr(kind,status,{row,col}){
	this.row=row,this.col=col;
	this.kind=kind;
	this.aid=testData.targetInfo.aid;
	this.status=status;
	this.fromId=++cnt;
	return this;
}

let okArr=[];
let cnt=0;
let tcnt=0;

function testEnd(){
	if(tcnt==100){
		process.exit();
	}
	okArr=[];
	setTimeout(()=>{
		rs.initActivity(5,` \n sssssssssss\n sssssssssss\n sssssssssss`).then(()=>{
			// console.log(1);
			rs.getSeatMap(5).then(res=>{
				// console.log(res);
				// runTest();
				runTest(100*1000,1000*10);
			})
			// runTest(100*1000,1000*10);
		})
	},1000*10);
	
}

async function runTest(it,wt){
	console.log('Test Start #'+(++tcnt));
	let d=new Date();
	for(let i=1;i<=it;i++){
		setTimeout(()=>{
			let col=Math.ceil(Math.random()*11),row=Math.ceil(Math.random()*3);
			// let col=2,row=2;
			rs.changeSeatMap({aid:testData.targetInfo.aid,idx:row},
				new Opr('choose','c',{row,col}),(res)=>{
				if(res.length){
					// console.log('[success]',new Date(),res);
					okArr.push(...res.map(opr=>opr.end3-opr.begin3));
					if(okArr.length==33){
						// console.log(okArr.sort());
						console.log('Test End!',okArr.reduce((val,ele)=>val+ele,0)/33);
						// console.log(new Date()-d);
						testEnd()
					}
				}
			})
		},wt*Math.random())
	}
}

rs.onready=()=>{
	rs.initActivity(5,` \n sssssssssss\n sssssssssss\n sssssssssss`).then(()=>{
		runTest(100*1000,1000*10);
	})
}
