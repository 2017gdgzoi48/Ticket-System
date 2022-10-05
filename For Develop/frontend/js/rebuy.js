import {createApp,ref,reactive} from 'vue';
import axios from '../inc/axios.js';
import {handleSeatMap} from '../inc/util.js';
import {Toast,NavBar,Button,Dialog,Field,CellGroup} from 'vant';
// import showArea from '../component/mobile/showArea.vue';
import seatMap from '../component/mobile/seatMap.vue';

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

			ws=io('http://'+location.hostname+':1234');
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
		}).catch(({msg,code})=>{
			Toast(`操作失败，${code}-${msg}`);
		});
		return {
			activity:{},
			chooseTicket,
			limit:1,
			cardid:'',
			schoolType:'B',
			seatMap:"",
			token:[]
		}
	},
	methods:{
		changeStatus:function(opr){
			if(this.chooseTicket.length==this.limit&&opr.status!=='s'){
				Toast('已达上限。')
				return;
			}
			sendWS(opr);
			console.log(opr)
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
			let reqArr=temp.map(opr=>{
				ws.emit("changeSeatMapFromClient",{
					fromId:sid,
					opr
				});
				return new Promise((res,rej)=>{
					let timeout=setTimeout(()=>rej('ws'),3000);
					let handle=ws.on("changeSeatMap",oprList=>{
						// console.log(opr,oprList);
						let ok=oprList.some(cur=>cur.col==opr.col&&cur.row==opr.row&&cur.status==opr.status&&cur.toId==sid);
						console.log(ok,opr,oprList);
						if(ok){
							ws.off(handle);
							clearTimeout(timeout);
							res();
						}
					});
				})
			});
			Promise.all(reqArr).then(()=>{
				let reqArr=temp.map(ticket=>{
					let {row,col,realPos}=ticket;
					let {areaid,areaName}=this.activity.seatMap.map[realPos[0]][realPos[1]].area;
					return axios.get('/api/round2BuyTicket',{
						params:{
							content:JSON.stringify([areaid,areaName,row,col]),
							aid:this.activity.aid,
							cardid:this.cardid,
							schoolType:this.schoolType
						}
					});
				})
				return Promise.all(reqArr);
			}).then(res=>{
				// console.log(res);
				// let {token}=res;
				this.token.push(...res.map(ele=>ele.data.token));
				// throw new Error;
			}).catch(err=>{
				Toast("操作失败");
				console.log(err);
				temp.forEach(opr=>{
					ws.emit("changeSeatMapFromClient",{
						fromId:sid,
						opr:{
							...opr,
							kind:'returnTicket',
							status:'s'
						}
					});
				})
			});
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
app.use(Field);
app.use(CellGroup);
// app.component('m-show-area',showArea);
app.component('m-seat-map',seatMap);
// app.component('m-buy-tool',buyTool);
app.mount('#app');