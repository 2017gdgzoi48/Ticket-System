<script setup>
import {ref,reactive} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 
import {getUserPhotoURL} from '../../inc/util.js';

const filterKey=ref('token');
const filterValue=ref('');
const ticketList=ref([]);
const errorToken=ref(false);
const cardid=ref('');

function validateTicket(){
	let hide=message.loading();
	axios.get('/api/validateTicket',{
		params:{
			token:filterValue.value
		}
	}).then(res=>{
		hide();
		ticketList.value=[res.data];
		message.success('验证成功！');
	}).catch(({code,msg})=>{
		if(code==307){
			errorToken.value=true;
			message.error('假的凭证！');
		}else{
			message.error(`验证失败！${code}-${msg}`);
		}
		hide();
	})
}

function query(){
	errorToken.value=false;
	if(filterKey.value=='token'){
		validateTicket();
		return;
	}
	let hide=message.loading();
	axios.get('/api/getAllTicket',{
		params:{
			condition:JSON.stringify(Object.fromEntries([[filterKey.value,filterValue.value]]))
		}
	}).then(res=>{
		hide();
		ticketList.value=res.data;
		message.success('拉取成功！');
	}).catch(({code,msg})=>{
		hide();
		message.error(`拉取失败！${code}-${msg}`);
	})
}

function useTicket(idx){
	let hide=message.loading();
	axios.get('/api/useTicket',{
		params:{
			tid:ticketList.value[idx].tid
		}
	}).then(res=>{
		hide();
		message.success('修改成功！');
		ticketList.value[idx].used=true;
	}).catch(({code,msg})=>{
		hide();
		message.error(`修改失败！${code}-${msg}`);
	})
}

function addUserInfo(idx){
	let {tid}=ticketList.value[idx];
	let hide=message.loading();
	axios.get('/api/addPayerInfo',{
		params:{
			tid,
			cardid:cardid.value
		}
	}).then((res)=>{
		hide();
		message.success('修改成功');
	}).catch(({code,msg})=>{
		hide();
		message.error(`修改失败！${code}-${msg}`);
	})
}
</script>

<template>
<div class="search-input">
	<a-select v-model:value="filterKey">
		<a-select-option value="tid">tid</a-select-option>
		<a-select-option value="token">token</a-select-option>
		<a-select-option value="payer">支付者卡号</a-select-option>
		<a-select-option value="payerId">支付者ID</a-select-option>
	</a-select>
	<a-input size="large" v-model:value="filterValue"></a-input>
	<a-button @click="query(token)">查询</a-button>
</div>
<div>
<div class="query-result">
	<div class="error" v-if="errorToken">
		未查询到相关信息<br>
		可能是<span>假的凭证</span>
	</div>
	<div class="result" v-for="(ticket,idx) in ticketList">
		<div class="ticket-info">
			<div class="info-left">
				<div><span>活动ID :</span>{{ticket.aid}}</div>
				<div><span>选区名 :</span>{{ticket?.content?.areaName}}区</div>
				<div><span>行列 :</span>{{ticket?.content?.row}}行、{{ticket?.content?.col}}列</div>
				<div><span>价格 :</span>{{ticket.price}}元</div>	
			</div>
			<div class="info-right">
				<a-image :src="getUserPhotoURL(ticket.payer.uid)" />
			</div>
		</div>
		<div class="add-info" v-if="filterKey=='token'">
			<a-input v-model:value="cardid"></a-input>
			<a-button type="primary" @click="addUserInfo(idx)">登记</a-button>
		</div>
		<div class="use-ticket" v-if="filterKey=='token'">
			<a-button round type="primary" :disabled="error||ticket.used"  @click="useTicket(idx)">标记为已使用</a-button>
		</div>
	</div>
</div>
</div>
</template>

<style scoped>
.search-input{
	margin-top: 30px;
	padding: 0 20vw;
	display: flex;
	align-items: center;
}
.search-input>:first-child{
	width: 120px;
	margin-right: 30px;
}
.search-input>:nth-child(2){
	flex: 1;
	margin-right: 30px;
}
.result{
	/*border-bottom: 1px solid blue;*/
	margin-bottom: 80px;
}
.error{
	font-size: 40px;
	text-align: center;
	width: 60vw;
	margin: 0 auto;
}
.error>span{
	color: red;
	font-weight: bolder;
}
.use-ticket{
	text-align: center;
	width: 30vw;
	margin: 30px auto;
}
.ticket-info{
	display: flex;
	/*flex-direction: column;*/
}
.info-left{
	font-size: 40px;
	flex: 2;
}
.info-left>div{
	width: 30vw;
	margin: 0 auto;
}
.info-left>div>span{
	color: grey;
	width: 120px;
	display: inline-block;
	text-align: left;
	font-size: 30px;
}
.info-right{
	flex: 1;
	margin-right: 20px;
	transform: scale(0.5);
	transform-origin: 0 0;
	max-height: 40vh;
}
.add-info{
	width: 50vw;
	margin: 30px auto;
	text-align: center;
}
.add-info>input{
	width: 200px;
	margin-right: 30px;
}
</style>