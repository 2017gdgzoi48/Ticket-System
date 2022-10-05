<script setup>
import {ref,reactive} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 

const token=ref('');
const ticket=ref({});
const error=ref(false);
const cardid=ref('');
const school=ref('B');

function query(token){
	if(!token)return;
	error.value=false;
	var hide=message.loading();
	axios.get('/api/validateTicket',{
		params:{
			token
		}
	}).then(res=>{
		hide();
		if(res.data.code==306){
			error.value=true;
			message.error('假的凭证！');
			return;
		}
		if(res.data.code.toString()[0]!=='2'){
			message.error('操作失败！');
			return;
		}
		ticket.value=res.data.data;
	})
}

function useTicket(token){
	var hide=message.loading();
	axios.get('/api/useTicket',{
		params:{
			token
		}
	}).then(res=>{
		hide();
		if(res.data.code.toString()[0]!=='2'){
			message.error('操作失败！');
			return;
		}
		message.success('修改成功！');
		ticket.value.used=true;
	});
}

function getPhotoURL(openid,cardid){
	if(!Boolean(cardid))return `http://${location.hostname}:8080/api/getUserPhoto?openid=${openid}`;
	else return `http://${location.hostname}:8080/api/getUserPhoto?cardid=${cardid}`
}

function addUserInfo(){
	var {token}=ticket.value;
	var hide=message.loading();
	axios.get('/api/addPayerInfo',{
		params:{
			token,
			cardid:cardid.value
		}
	}).then((res)=>{
		if(res.data.code.toString()[0]!=='2'){
			message.error('操作失败');
			return;
		}
		hide();
		message.success('修改成功');
	})
}
</script>

<template>
<div class="input-token">
	<a-input size="large" placeholder="查询的token" v-model:value="token"></a-input>
	<a-button @click="query(token)">查询</a-button>
</div>
<div>
<div class="query-result">
	<div class="error" v-if="error">
		未查询到相关信息<br>
		可能是<span>假的凭证</span>
	</div>
	<div class="result" v-if="Object.keys(ticket).length">
		<div class="result-left">
			<div><span>活动ID :</span>{{ticket.aid}}</div>
			<div><span>选区名 :</span>{{ticket?.content?.areaName}}区</div>
			<div><span>行列 :</span>{{ticket?.content?.row}}行、{{ticket?.content?.col}}列</div>
			<div><span>价格 :</span>{{ticket.price}}元</div>	
		</div>
		<div class="result-right">
			<a-image :src="getPhotoURL(ticket.payer,ticket.content.tempCardid)" />
		</div>
	</div>
</div>
<div class="add-info" v-if="Object.keys(ticket).length!==0">
		<a-select v-model:value="school">
			<a-select-option value="A">初中部</a-select-option>
			<a-select-option value="B">高中部</a-select-option>
		</a-select>	
		<a-input v-model:value="cardid"></a-input>
		<a-button type="primary" @click="addUserInfo()" >登记</a-button>
	</div>
<div class="use-ticket">
	<a-button round type="primary" :disabled="error||ticket.used" v-if="Object.keys(ticket).length" @click="useTicket(token)">标记为已使用</a-button>
</div>
</div>
</template>

<style scoped>
.input-token{
	margin-top: 30px;
	padding: 0 20vw;
	height: 10vh;
	line-height: 10vh;
}
.input-token>:first-child{
	width: 70%;
	margin-right: 30px;
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
.result{
	display: flex;
}
.result-left{
	font-size: 40px;
	flex: 2;
}
.result-left>div{
	width: 30vw;
	margin: 0 auto;
}
.result-left>div>span{
	color: grey;
	width: 120px;
	display: inline-block;
	text-align: left;
	font-size: 30px;
}
.result-right{
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