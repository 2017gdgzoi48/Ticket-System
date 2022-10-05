<script setup>
import {ref,reactive,watch} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 

const sysConfig=reactive({});
const logo=ref([]);

async function load(){
	let hide=message.loading();
	let keys=['sysName','wxKeyWord','wxTipText','wxWelcomeText','wxFailText','userAnnounce'];
	for(let key of keys){
		await axios.get('/api/getConfig',{params:{key}}).then(res=>{
			// console.log(s);
			sysConfig[key]=res.data.value;
		}).catch(({code,msg})=>{
			message.error(`获取信息失败！${code}-${msg}`);
		})
	}	
	hide();
}

load();

async function submit(){
	let {...obj}=sysConfig;
	let hide=message.loading();
	try{
		for(let key in obj){
			let val=obj[key];
			// console.log(key,val);
			if(key=='wxKeyWord')val=val.toString().split(',');
			await axios.get('/api/setConfig',{
				params:{
					key,
					value:JSON.stringify(val)
				}
			});
		}
	}catch(err){
		hide();
		message.error('修改失败！'+err);
		return;
	}
	hide();
	message.success('修改成功！');
}

watch(logo,val=>{
	if(val.length<1)return;
	let hide=message.loading();
	let img=val[0];
	let fd=new FormData();
	fd.append('logo',img.originFileObj);
	axios.post('/api/uploadLogo',fd).then(res=>{
		hide();
		message.success('上传成功！');
	}).catch(({code,msg})=>{
		hide();
		message.error(`上传失败！${code}-${msg}`);
	})
})

;
</script>

<template>
<div class="input-item">
	<span class="input-key">系统名称</span>
	<span class="input-value"><a-input v-model:value="sysConfig.sysName"></a-input></span>
</div>
<div class="input-item">
	<span class="input-key">上传logo</span>
	<span class="input-value">
		<a-upload list-type="picture-card" v-model:file-list="logo">
			<span v-if="logo.length==0">上传</span>
		</a-upload>
	</span>
</div>
<div class="input-item">
	<span class="input-key">微信入口关键词</span>
	<span class="input-value"><a-input v-model:value="sysConfig.wxKeyWord"></a-input></span>
</div>
<div class="input-item">
	<span class="input-key">微信入口提示词</span>
	<span class="input-value"><a-textarea v-model:value="sysConfig.wxTipText"></a-textarea></span>
</div>
<div class="input-item">
	<span class="input-key">微信订阅欢迎词</span>
	<span class="input-value"><a-textarea v-model:value="sysConfig.wxWelcomeText"></a-textarea></span>
</div>
<div class="input-item">
	<span class="input-key">微信未识别信息提示词</span>
	<span class="input-value"><a-textarea v-model:value="sysConfig.wxFailText"></a-textarea></span>
</div>
<div class="input-item">
	<span class="input-key">用户首页通知</span>
	<span class="input-value"><a-textarea v-model:value="sysConfig.userAnnounce"></a-textarea></span>
</div>
<div class="action">
	<a-button type="primary" @click="submit">确认</a-button>
</div>
</template>

<style scoped>
.action{
	text-align: center;
	margin-bottom: 30px;
}
.action>:first-child{
	margin-right: 30px;
}
.input-item{
	width: 420px;
	margin: 20px auto;
}
.input-key{
	width: 110px;
	display: inline-block;
	vertical-align: top;
}
.input-value{
	width: 300px;
	display: inline-block;
	margin-left: 10px;
	margin-bottom: 20px;
}
</style>