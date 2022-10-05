<script setup>
import {ref,reactive,watch} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 
import {io} from "socket.io-client";
import {handleSeatMap} from '../../inc/util.js';

const props=defineProps(['aid']);
const emits=defineEmits(['submit','cancel']);
const activity=ref({});
const selectArea=ref([]);
const ticketList=ref([]);
const currentTicket=ref({});
const currentToken=ref('');
const cardid=ref('');
const school=ref('B');
const visible=ref(false);

//获取该活动的区域列表
function getData(aid){
	if(!aid)return;
	let hide=message.loading();
	axios.get('/api/getActivityInfo',{
		params:{aid},
	}).then(res=>{
		hide();
		activity.value=res.data;
	}).catch(({code,msg})=>{
		hide();
		message.error(`拉取失败！${code}-${msg}`);
	})
}
getData(props.aid);
watch(()=>props.aid,aid=>{
	getData(aid);
})

//处理websocket相关
const ws=io('http://'+location.hostname+':1234');
const sid=Math.round(Math.random()*100000000).toString(16);
ws.on("connect",()=>{
	message.success('连接成功');
})
ws.on("changeSeatMap",oprList=>handleChange(oprList));
ws.on("initSeatMap",async str=>{
	if(!str)return;
	let {seatMap,area}=activity.value;
	let avaiableSeatList=handleSeatMap(seatMap,area).map.flat().filter(seat=>{
		return selectArea.value.includes(seat?.areaIdx);
	}).map(seat=>[`${seat.row}-${seat.col}`,seat]);
	ticketList.value=str.split("\n").map((rowData,row)=>(rowData??'').split('').map((seatStatus,col)=>{
		let str=`${row}-${col}`;
		let seat=avaiableSeatList.find(seat=>seat[0]==str);
		if(seat&&seatStatus=='s')return seat;
		else return '';
	})).flat().filter(Boolean).map(ticket=>ticket[1]);
	// console.log('getStr');
});
ws.on('disconnect',()=>{
	message.error('断连');
});

//接受变更
function handleChange(oprList){
	console.log(oprList,ticketList.value);
	oprList.forEach(opr=>{
		let str=`${opr.row}-${opr.col}`;
		if(opr.status!='s')ticketList.value=ticketList.value.filter(ticket=>{
			return !(ticket.row==opr.row&&ticket.col==opr.col&&activity.value.aid==opr.aid);
		});
		else start();
	});
}

function start(){
	ws.emit("initSeatMapFromClient",{aid:activity.value.aid,sid});
}
function selectOne(){
	let list=ticketList.value;
	currentToken.value='';
	if(!list.length){
		message.info('没有空余座位了');
		return;
	}
	list.sort((a,b)=>Math.random()-Math.random());
	currentTicket.value=list[0];
	ticketList.value=list;
	visible.value=true;
}


function buyIt(){
	let opr={
		aid:activity.value.aid,
		row:currentTicket.value.row,
		col:currentTicket.value.col,
		status:'b',
		kind:'round2Buy'
	}
	let openid=Math.round(Math.random()*10e10).toString(16),uid;
	let hide=message.loading();
	let req=new Promise((res,rej)=>{
		ws.emit("changeSeatMapFromClient",{
			fromId:sid,
			opr
		});
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
	req.then(()=>{
		let {areaid,areaName}=currentTicket.value.area,{row,col}=currentTicket.value;
		let content=[areaid,areaName,row,col];
		return axios.get('/api/round2BuyTicket',{
			params:{
				cardid:cardid.value,
				schoolType:school.value,
				content:JSON.stringify(content),
				aid:activity.value.aid
			}
		})
	}).then(res=>{
		currentToken.value=res.data.token;
		hide();
		message.success('购买成功');
	}).catch(err=>{
		hide();
		if(err=='ws'){
			message.error('操作失败！websocket超时！');
		}else{
			let {code,msg}=err;
			message.error(`操作失败！${code}-${msg}`);
			opr.status='s';
			opr.kind='returnTicket';
			console.log('rollback');
			ws.emit('changeSeatMapFromClient',{
				fromId:sid,
				opr
			})
		}
	})
}
;
</script>

<template>
<div class="start-config" v-if="ticketList.length==0&&Object.keys(currentTicket).length==0">
	选择参与第二轮的区域
	<a-checkbox-group v-model:value="selectArea" name="checkboxgroup" :options="activity.area?.map((area,idx)=>{
		return {label:area.areaName,value:idx}
	})"/><br>
	<a-button type="primary" class="start-button" @click="start">开始第二轮</a-button>
</div>
<div class="run-round2" v-else>
	<div class="now-left">
		<span>可选座位：<span class="number">{{ticketList.length}}</span>个</span>
		<span>
			<a-button @click="selectOne">随机选一个</a-button>
		</span>
	</div>
	<div class="current-ticket" v-if="Object.keys(currentTicket).length!==0">
		<div><span>选区名:</span>{{currentTicket.area?.areaName}}区</div>
		<div><span>行列:</span>{{currentTicket.row}}行、{{currentTicket.col}}列</div>
		<div><span>价格:</span>{{currentTicket.area?.price}}元</div>
		<div v-if="currentToken!==''"><span>凭证:</span>{{currentToken}}</div>
	</div>
	<div class="buy-ticket" v-if="Object.keys(currentTicket).length!==0">
		<a-select v-model:value="school">
			<a-select-option value="A">初中部</a-select-option>
			<a-select-option value="B">高中部</a-select-option>
		</a-select>	
		<a-input v-model:value="cardid"></a-input>
		<a-button type="primary" @click="buyIt()" :hidden="!visible">买</a-button>
	</div>
</div>
</template>

<style scoped>
.start-config{
	text-align: center;
}
.start-button{
	margin-top: 20px;
}
.now-left{
	text-align: center;
}
.now-left>:first-child{
	margin-right: 30px;
}
.now-left .number{
	font-size: large;
	font-weight: bolder;
}
.current-ticket{
	font-size: 40px;
}
.current-ticket>div{
	width: 30vw;
	margin: 0 auto;
}
.current-ticket>div>span{
	color: grey;
	width: 120px;
	display: inline-block;
	text-align: left;
	font-size: 30px;
}
.buy-ticket{
	width: 50vw;
	margin: 30px auto;
	text-align: center;
}
.buy-ticket>input{
	width: 50%;
	margin-right: 30px;
}
</style>