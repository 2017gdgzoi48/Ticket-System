<script setup>
import {Dialog} from 'vant';
const props=defineProps(["chooseTicket","leftNum"]);
const emits=defineEmits(["buy"]);

function confirm(){
	if(props.chooseTicket.length==0)return;
	let confirmStr=props.chooseTicket.reduce((val,{price,areaName,areaid},idx)=>{
		if(!val[areaid])val[areaid]=[0,areaName,price];
		val[areaid][0]++;
		return val;
	},{});
	confirmStr=Object.entries(confirmStr).map(([key,val],idx)=>{
		let [cnt,areaName,price]=val;
		return `${idx+1}: ${cnt}张${areaName}区，共${cnt*price}元`;
	}).join('\n');
	let totSum=props.chooseTicket.reduce((val,{price})=>{
		return val+price;
	},0);
	Dialog.confirm({
		title:'确认下单',
		message:`您的订单为：
${confirmStr}
总计：${totSum}元`
	}).then(()=>{
		emits('buy');
	}).catch(err=>{
		console.log(err);
	});
}

;
</script>

<template>
<div class="buy-tool">
	<span class="current">
		当前选择座位数：
		<span class="highlight">{{chooseTicket.length}}</span>
		/
		<span class="highlight">{{!Number.isFinite(leftNum)?'inf':leftNum}}</span>
	</span>
	<van-button class="ok-btn" size="small" :disabled="chooseTicket.length<=0" @click="confirm">确认</van-button>
</div>
</template>

<style scoped>
.buy-tool{
	margin-bottom:20px;
	width: 80vw;
	height: 60px;
	background: linear-gradient(321.06deg, #f0f5ff 7.5%, #FFFFFF 100%);
	box-shadow: 0px 20px 40px #CEDBEF, inset 3px 3px 10px rgba(255, 255, 255, 0.72);
	border-radius: 20px;
	/*margin: 5px auto 10px;*/
	bottom: 5vh;
	display: flex;
	line-height: 40px;
	position: absolute;
	z-index: 10;
	left: calc(50vw - 40vw);
}
.current{
	align-self: center;
	color:black;
	font-weight:bold;
	font-family: "Microsoft YaHei UI",serif;
	flex: 2;
	margin-left: 20px;
}
.highlight{
	font-size: larger;
	color: #5f3fd4;
	font-weight: bolder;
}
.ok-btn{
	color:white;
	font-size: initial !important;
	background: linear-gradient(315deg, #4624C2 0%, #7F5BFF 100%);
	box-shadow: 0px 20px 40px #ebf0ff, inset 0px -3px 10px rgba(0, 0, 0, 0.37), inset 3px 1px 15px rgba(255, 255, 255, 0.5);
	border-radius: 20px;
	align-self: center;
	display: inline-block;
	margin-right:20px;
	text-align: center;
	height: 40px;
	width: 60px;
}
</style>