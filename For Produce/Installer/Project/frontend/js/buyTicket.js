import {createApp,ref,reactive} from 'vue';
import axios from '../inc/axios.js';
import {TransactionAsync,wsDoOpr} from '../inc/transaction.js';
import {handleSeatMap} from '../inc/util.js';
import {wsPort} from '../inc/config.js';
import {Toast,NavBar,Button,Dialog} from 'vant';
// import showArea from '../component/mobile/showArea.vue';
import seatMap from '../component/mobile/seatMap.vue';
import buyTool from '../component/mobile/buyTool.vue';
import {io} from "socket.io-client";

let ws;
let chooseTicket=ref([]);
const sid=Math.round(Math.random()*100000000).toString(16);

const sendWS=(function(){
	let lastTime=-1;
	return function(opr){
		if(!ws.connected){
			Toast('正在连接，请稍等……');
			return;
		}
		if(Date.now()-lastTime<300){
			Toast('操作过于频繁，请稍后再试');
			return;
		}
		lastTime=Date.now();
		ws.emit('changeSeatMapFromClient',{
			fromId:sid,
			opr
		});
	}
})()

const app=createApp({
	data:function(){
		let aid=Number(location.search.slice(5));
		axios.get('/api/getActivityInfo',{
			params:{aid}
		}).then(res=>{
			res=res.data;
			// console.log(res);
			this.activity=res;
			this.activity.seatMap=handleSeatMap(res.seatMap,res.area);
			// console.log(this.activity.seatMap.toShortString());
			this.seatMap=this.activity.seatMap.toShortString().split('\n').map(row=>row.split(''));
			console.log(this.seatMap);
			this.limit=this.activity.limitNum;

			ws=io('http://'+location.hostname+':'+wsPort);
			ws.on("connect",()=>{
				Toast('连接成功');
				ws.emit("initSeatMapFromClient",{aid:this.activity.aid,sid});
			})
			ws.on("changeSeatMap",oprList=>this.handleChange(oprList));
			ws.on("initSeatMap",str=>{
				if(!str)return;
				this.seatMap=str.split("\n").map(row=>row.split(''));
				console.log('getStr');
			});
			ws.on('disconnect',()=>{
				Toast('断连')
				chooseTicket.value=[];
			});
			return axios.get('/api/getUser');
		}).then(res=>{
			let user=res.data;
			this.user=user;
			if(user.level<0){
				alert('请先完善个人信息。');
				window.onbeforeunload=null;
				history.go(-1);
			}
			let {openTime,closeTime}=this.activity;
			// console.log(Date.now()-new Date(closeTime)>0&&user.level<1);
			if(Date.now()-new Date(openTime)<0&&user.level<1){
				alert('活动尚未开始（请不要作弊）');
				location.assign('./userIndex.html');
				return;
			}
			if(Date.now()-new Date(closeTime)>0&&user.level<1){
				alert('活动已经结束（请不要作弊）');
				location.assign('./userIndex.html');
				return;
			}
			// console.log(user);
			if(user.level==1){
				this.activity.limitNum=this.limit=Infinity;
			}
			return axios.get('/api/getBelonging');
		}).then(res=>{
			let historyTicket=res.data.filter(ticket=>ticket.aid==this.activity.aid);
			this.alreadyBuy=historyTicket.length;
		}).catch(({msg,code})=>{
			Toast(`操作失败，${code}-${msg}`);
		});
		return {
			activity:{},
			chooseTicket,
			alreadyBuy:0,
			limit:1,
			user:null,
			seatMap:""
		}
	},
	methods:{
		changeStatus:function(opr){
			if(this.alreadyBuy+this.chooseTicket.length==this.limit&&opr.kind=='choose'){
				Toast('买的票数已经达到上限');
				return;
			}
			sendWS(opr);
			// console.log(opr)
		},
		handleChange:function(oprList){
			console.log(oprList,sid);
			oprList.forEach(opr=>{
				let {col,row,aid,toId,status,realPos}=opr;
				if(aid!==this.activity.aid)return;
				if(toId==sid){
					if(status=='c'){
						// console.log()
						if(chooseTicket.value.some(ticket=>ticket.aid==aid&&ticket.row==row&&ticket.col==col)){
							return ;
						}
						let {price,areaName}=this.activity.seatMap.map[realPos[0]][realPos[1]].area;
						if(chooseTicket.value.length+this.alreadyBuy==this.limit){
							// Toast('买的票数已经达到上限');
							console.log('卡网速？',opr);
							opr.kind="cancelChoose";
							opr.status="s";
							sendWS(opr);
							return;
						}
						chooseTicket.value.push({
							row,col,aid,status:'b',
							price,areaName,realPos,
							kind:'buyTicket'
						});
						status='u';
					}else if(status=='s'){
						// debugger;
						chooseTicket.value=chooseTicket.value.filter(ticket=>{
							return !(ticket.row==row&&ticket.col==col);
						});
					}
				}
				this.seatMap[row][col]=status;
			})
		},
		buy:function(){
			let temp=this.chooseTicket.map(ticket=>{
				delete ticket.price;
				delete ticket.areaName;
				return ticket;
			});
			console.log(temp);
			
			TransactionAsync(temp,[opr=>{
				return wsDoOpr(ws,opr);
			},ticket=>{
				let {row,col,realPos}=ticket;
				let {areaid,areaName}=this.activity.seatMap.map[realPos[0]][realPos[1]].area;
				return axios.get('/api/buyTicket',{
					params:{
						content:JSON.stringify([areaid,areaName,row,col]),
						aid:this.activity.aid
					}
				});
			}],[opr=>{
				ws.emit("changeSeatMapFromClient",{
					fromId:sid,
					opr:{
						...opr,
						kind:'returnTicket',
						status:'s'
					}
				});
			}]).then(res=>{
				console.log(res);
				if(res.filter(Boolean).length<res.length){
					let failedNum=res.filter(ele=>ele==null).length;
					let go=confirm(`您的${temp.length}张票中，有${failedNum}张购买失败。\n是否仍然前往订单页面？`);
					if(!go){
						Toast(`${res.length-failedNum}/${res.length}张购买成功`);
						setTimeout(()=>{location.reload()},600);
						return;
					}
				}
				chooseTicket.value=[];
				Toast(`${res.length}张票购买成功，即将返回用户主页。`);
				setTimeout(()=>{location.assign('userIndex.html#1')},600);
			})
		}
	}
});

// function clearTickets(){
// 	ws.emit('clearAllChooseFromClient',{
// 		fromId:sid
// 	});
// 	chooseTicket.value=[];
// }
// window.addEventListener('pagehide',clearTickets);
// window.addEventListener('beforeunload',clearTickets);

app.use(Toast);
app.use(NavBar);
app.use(Button);
app.use(Dialog);
// app.component('m-show-area',showArea);
app.component('m-seat-map',seatMap);
app.component('m-buy-tool',buyTool);
app.mount('#app');

// setTimeout(()=>{
// 	ws.disconnect();
// 	// ws.connect();
// },1000)