<script setup>
import {ref,watch} from 'vue';
import axios from '../../inc/axios.js'; 
import {TransactionAsync,wsDoOpr} from '../../inc/transaction.js';
import {Toast} from 'vant';
import {io} from "socket.io-client";
import {wsPort} from '../../inc/config.js';

const ws=io('http://'+location.hostname+':'+wsPort);
const props=defineProps(['ticket']);
const emits=defineEmits(['goBack']);

const time=ref('活动结束后');
watch(()=>props.ticket,val=>{
	if(val?.inited)return;
	time.value='活动结束后';
	axios.get('/api/getActivityInfo',{params:{aid:val.aid}}).then(({data})=>{
		// console.log(data);
		let {closeTime}=data;
		console.log(closeTime);
		time.value=new Date(closeTime).toLocaleString();
	})
})

function returnTicket(){
	let reply=confirm('您确定要退票吗？');
	if(reply==false)return;
	let {row,col}=props.ticket.content,{aid,tid,inited}=props.ticket;
	if(!props.ticket.inited){
		row=props.ticket.tempContent[2];
		col=props.ticket.tempContent[3];
	}
	TransactionAsync([{row,col,aid,tid}],[({row,col,aid,tid})=>{
		// if(!inited)return new Promise((res)=>res());
		return wsDoOpr(ws,{
			row,
			col,
			aid,
			status:'s',
			kind:'returnTicket'
		})
	},()=>{
		return axios.get('/api/returnTicket?tid='+props.ticket.tid);
	}],[()=>{
		// if(!inited)return;
		wsDoOpr(ws,{
			row,
			col,
			aid,
			status:'b',
			kind:'round2Buy'
		})
	}]).then(res=>{
		if(res[0]){
			Toast('退票成功');
			emits('goBack');
		}
		else Toast('退票失败');
	})
}
</script>

<template>
<van-nav-bar title="详细信息" left-arrow @click-left="emits('goBack')">
</van-nav-bar>
<div class="ticket-token">
	<span class="token-title">校验码</span>
	<span class="token-content">{{ticket.token}}</span>
</div>
<van-divider>
	<span v-if="ticket.inited">请妥善保留验证码，切勿转发给他人。</span>
	<span v-else>这张票尚未分配，预计于{{time}}分配。</span>
</van-divider>
<div class="more-info">
	<van-cell-group inset>
	<van-cell title="订单号" :value="ticket.tid"/>
	<van-cell title="活动名称" :value="ticket.activityName" />
	<van-cell title="支付者id" :value="ticket.payer?.uid" />
	<van-cell title="座位信息" :value="ticket.content?.fullText" />
	<van-cell title="下单时间" :value="new Date(ticket.time).toLocaleString()" />
	<van-cell title="是否已检票" :value="(ticket.used?'是':'否')" />
	<van-cell title="金额" :value="ticket.price" />
	</van-cell-group>
</div>
<div class="return-ticket">
	<div class="action">
		<van-button class="return-btn" color="linear-gradient(to right, #ff6034, #ee0a24)" round type="danger" :disabled="ticket.used" @click="returnTicket">退票</van-button>
	</div>
</div>
</template>

<style>
	.home{
		width: 100%;
		height: 100%;
		background-color: #f7f8fa;
		position: fixed;
	}
.token-title{
	display: block;
	width: 100%;
	font-size: 20px;
	margin-top: 20px;
	text-align: center;
	color: grey;
}
.token-content{
	display: block;
	width: 100%;
	text-align: center;
	font-size: 50px;
	font-weight: bolder;
}
.more-info{
	margin-bottom: 20px;
}
.return-btn{
	width:350px;
	display: block;
	margin-right: 0;
	margin-left: 0;
	margin-bottom: auto;
}
.return-ticket{
	text-align: center;
}
.action{
	margin: 30px auto;
	width: fit-content;
}
</style>