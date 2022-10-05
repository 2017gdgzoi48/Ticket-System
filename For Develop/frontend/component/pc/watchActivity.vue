<script setup>
import {ref,reactive,computed} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 
import seatmapShow from './seatmapShow.vue';
import {io} from "socket.io-client";
import {handleSeatMap} from '../../inc/util.js';
import {wsPort} from '../../inc/config.js';

const aid=ref('');
const activity=ref({});
const seatMap=ref(null);
const ws=io('http://'+location.hostname+':'+wsPort);
const sid=Math.round(Math.random()*100000000).toString(16);

const oprHis=reactive([]);
const seatToArea={};
const seatCount=computed(()=>{
	if(!seatMap.value)return {};
	let map=seatMap.value;
	let totalCnt=new Array(activity.value.area.length).fill(0),curCnt=new Array(activity.value.area.length).fill(0);
	map.forEach((rowData,row)=>{
		if(!rowData)return;
		rowData.map((status,col)=>{
			if(!col)return;
			let areaIdx=seatToArea[`${row}-${col}`] ?? -1;
			if(areaIdx<0)return;
			if(status=='s')curCnt[areaIdx]++;
			if(status!=='d')totalCnt[areaIdx]++;
		})
	})
	let totalSum=totalCnt.reduce((val,ele)=>val+ele,0),curSum=curCnt.reduce((val,ele)=>val+ele,0);
	let priceSum=curCnt.reduce((val,ele,idx)=>{
		return val+(totalCnt[idx]-ele)*activity.value.area[idx].price;
	},0);
	return {
		totalCnt,curCnt,totalSum,curSum,priceSum
	}
})
const oprCount=computed(()=>{
	let recent=oprHis.filter(Boolean).filter(opr=>Date.now()-opr.timestamp<=60*1000);
	let recentCnt=recent.length;
	let avgTime=Math.round(recent.reduce((val,{lastFor})=>{
		return val+lastFor;
	},0)/recentCnt*1000)/1000;
	if(Number.isNaN(avgTime))avgTime=0;
	return {
		recentCnt,avgTime
	}
})
setInterval(()=>{
	oprHis.push(null);
	// oprHis.pop();
},60*1000);

function recieveSeatMap(seatMapStr){
	console.log(seatMapStr);
	seatMap.value=seatMapStr.split('\n').map(row=>row.split(''));
}

function recieveChange(oprList){
	let time=(new Date).toLocaleTimeString()
	// console.log('aa');
	oprList.forEach(opr=>{
		let text=`${opr.kind} on row ${opr.row} col ${opr.col} and set status '${opr.status}'`;
		let lastFor=new Date(opr.end2)-new Date(opr.begin2);
		oprHis.push({
			time,
			text,
			timestamp:Date.now(),
			lastFor
		});
	})
}

function initSeat(){
	let seatMapObj=handleSeatMap(activity.value.seatMap);
	seatMapObj.map.flat().filter(Boolean).forEach(seat=>{
		seatToArea[`${seat.row}-${seat.col}`]=seat.areaIdx;
	})
}

function watch(){
	let hide=message.loading();
	axios.get('/api/getActivityInfo',{params:{aid:aid.value}}).then(res=>{
		hide();
		message.success('开始查看！');
		activity.value=res.data;
		initSeat()
	}).catch(({code,msg})=>{
		hide();
		message.error(`拉取失败！${code}-${msg}`);
	})
	setInterval(()=>{
		ws.emit("initSeatMapFromClient",{aid:Number(aid.value),sid});
	},1500);
	ws.on('initSeatMap',recieveSeatMap);
	ws.on('changeSeatMap',recieveChange);
}

</script>

<template>
<div class="aid-input" v-if="!seatMap">
	<span>活动aid</span>
	<a-input v-model:value="aid"></a-input>
	<a-button @click="watch">查看</a-button>
</div>
<div class="watch-dashboard" v-else>
	<div class="count-data">
		<div class="count-total">
			<span class="count-item">
				<span class="count-name">总位置</span>
				<span class="count-val">{{seatCount.curSum}}/{{seatCount.totalSum}}</span>
			</span>
			<span class="count-item">
				<span class="count-name">已售出总价(元)</span>
				<span class="count-val">{{seatCount.priceSum}}</span>
			</span>
		</div>
		<div class="count-area">
			<ul class="count-list">
				<li class="count-list-item" v-for="(area,idx) in activity.area">
					<span>{{area.areaName}}</span>
					<span>{{seatCount.curCnt[idx]}}/{{seatCount.totalCnt[idx]}}</span>
				</li>
			</ul>
		</div>
		<div class="count-opr">
			<span class="count-item">
				<span class="count-name">每分钟处理</span>
				<span class="count-val">{{oprCount.recentCnt}}</span>
			</span>
			<span class="count-item">
				<span class="count-name">平均响应时间(ms)</span>
				<span class="count-val">{{oprCount.avgTime}}</span>
			</span>
		</div>
	</div>
	<div class="seatmap-show">
		<seatmap-show :seat-map-str="activity.seatMap" :seat-map-status="seatMap" :area-list="activity.area">
		</seatmap-show>
	</div>
	<div class="opr-history">
		<div class="opr-item" v-for="opr in oprHis.filter(Boolean)">
			<span class="opr-time">{{opr.time}}</span>
			<span class="opr-content">{{opr.text}}</span>
		</div>
	</div>
</div>
</template>

<style scoped>
.aid-input{
	width: fit-content;
	margin: 10px auto;
}
.aid-input>:nth-child(2){
	width: 200px;
	margin: 0 20px;
}
.watch-dashboard{
	display: flex;
	margin-top: 10px;
	flex-direction: column;
}
.seatmap-show{
	width: fit-content;
	margin: 0 auto;
}
.opr-history{
	height: 20vh;
	width: 80vw;
	margin: 10px auto;
	border: 1px solid black;
	padding: 5px;
	overflow-y: scroll;
}
.opr-time{
	margin-right: 10px;
	color: grey;
}
.count-data{
	display: flex;
	width: 60vw;
	margin: 0 auto 20px auto;
}
.count-total,.count-opr{
	display: flex;
	flex: 1;
}
.count-area{
	flex: 1;
}
.count-item{
	flex: 1;
	display: flex;
	flex-direction: column;
}
.count-name{
	font-size: larger;
	font-weight: bolder;
}
.count-val{
	font-size: large;
	font-family: 'consolas';
}
.count-list{
	padding-left: 0;
	margin: 0 auto;
	height: 10vh;
	overflow-y: scroll;
	width: fit-content;
}
.count-list-item{
	margin: 0 auto;
	font-size: large;
	padding-right: 10px;
}
.count-list-item>:first-child{
	font-weight: bolder;
	margin-right: 20px;
}
</style>