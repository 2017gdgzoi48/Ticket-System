<script setup>
import {ref} from 'vue';
import {Toast} from 'vant';
import axios from '../../inc/axios.js'; 
import ticketList from './ticketList.vue';
import ticketDetail from './ticketDetail.vue';

const list=ref([]);
const current=ref({});
const refreshing=ref(false);
let inited=false;
let loading=Toast.loading({
 	message: '加载中...',
	forbidClick: true,
});

function refresh(){
	axios.get('/api/getBelonging').then(res=>{
		if(!inited)refreshing.value=false;
		else inited=true;
		// console.log(res);
		list.value=res.data || [];
		loading.clear();
	}).catch(({code,msg})=>{
		Toast(`操作失败,${code}-${msg}`);
	})
}
refresh();

;
</script>

<template>
<div class="page-title">
	我的订单
</div>
<div class="total">
	您一共有<span>{{list.length}}</span>张票，<br>
	其中有<span>{{list.filter(ele=>!ele.used).length}}</span>张未使用，请尽快使用。
	<br>单击门票即可查看详细信息。
</div>
<div>
	<van-pull-refresh @refresh="refresh" v-model="refreshing">
		<ticket-list :list="list" @showDetail="ticket=>current=ticket"></ticket-list>
	</van-pull-refresh>
	<div class="ticket-detail" v-show="current.tid">
		<ticket-detail :ticket="current" @goBack="current={},refresh()"></ticket-detail>
	</div>
</div>
</template>

<style scoped>
.total{
	line-height: 30px;
	margin-top: 16px;
	margin-left: 30px;
	letter-spacing: 1px;
	font-size: large;
	width: 80vw;
	color: rgba(68, 61, 61, 0.89)
}
.total span{
	color: rgb(75, 120, 254);
	font-weight: bolder;
	font-size: larger;
}
.page-title{
	padding-top: 40px;
	margin-left: 27px;
	width: 80vw;
	font-style: normal;
	font-weight: bold;
	font-size: 34px;
	line-height: 41px;
	letter-spacing: 0.374px;

	color: #000000;
}
.ticket-detail{
	min-height: 100vh;
	position: absolute;
	top: 0;
	left: 0;
	background: white;
	width: 100vw;
    z-index: 99;
}
</style>