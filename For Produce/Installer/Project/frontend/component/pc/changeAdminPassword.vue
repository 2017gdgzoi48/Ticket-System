<script setup>
import {ref,reactive} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 

const pw=ref('');
const repeatPw=ref('');

function submit(){
	if(pw.value!==repeatPw.value){
		message.error('两次输入的不一样');
		return;
	}
	var hide=message.loading();
	var password=pw.value;
	var fd=new FormData();
	fd.append('password',password);
	axios.post('/api/changeAdminPassword',fd,{
		headers:{
			'content-type':'multipart/form-data'
		}
	}).then(res=>{
		hide();
		if(res.data.code.toString()[0]!=='2'){
			message.error('操作失败！');
			return;
		}
		message.success('修改成功！');
	})
}
</script>

<template>
<div class="change-password">
	<div class="form">
		新密码: <span class="input"><a-input-password v-model:value="pw"></a-input-password></span><br>
		确认密码: <span class="input"><a-input-password v-model:value="repeatPw"></a-input-password></span>
	</div>
	<div class="submit">
		<a-button @click="submit" type="primary">确认</a-button>
	</div>
</div>
</template>

<style scoped>
.change-password{
	margin: 30px auto;
	width: fit-content;
}
.change-password .input{
	width: 200px;
	display: inline-block;
	margin-left: 30px;
	margin-bottom: 20px;
}
.submit{
	text-align: center;
}
</style>