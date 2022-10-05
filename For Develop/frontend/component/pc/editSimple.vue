<script setup>
import dayjs from 'dayjs';
import {ref,reactive,computed} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 

const props=defineProps(['activity']);
const emits=defineEmits(['submit','cancel']);

const activity=ref(props.activity);
activity.value.mode=['个人选座','自动分配'][props.activity.mode-1];
const timeRange=computed({
	get:function(){
		let openTime=dayjs(activity.value?.openTime);
		let closeTime=dayjs(activity.value?.closeTime);
		return [openTime,closeTime];
	},
	set:function(time){
		let [openTime,closeTime]=time.map(t=>t.$d);
		activity.value.openTime=openTime.toString();
		activity.value.closeTime=closeTime.toString();
	}
})

function submit(){
	let fd=new FormData;
	['laucher','activityName','limitNum','openTime','closeTime'].forEach(key=>{
		fd.append(key,activity.value[key]);
	})
	let hide=message.loading();
	axios.post('/api/updateActivity',fd,{
		params:{aid:activity.value.aid}
	}).then(res=>{
		hide();
		message.success('修改成功');
		emits('submit');
	}).catch(({code,msg})=>{
		hide();
		message.error(`修改失败！${code}-${msg}`);
	})
}
;
</script>

<template>
<div class="input-item">
	<span class="input-key">活动aid</span>
	<span class="input-value"><a-input v-model:value="activity.aid" :disabled="true"></a-input></span>
</div>
<div class="input-item">
	<span class="input-key">购买模式</span>
	<span class="input-value"><a-input v-model:value="activity.mode" :disabled="true"></a-input></span>
</div>
<div class="input-item">
	<span class="input-key">活动名称</span>
	<span class="input-value"><a-input v-model:value="activity.activityName"></a-input></span>
</div>
<div class="input-item">
	<span class="input-key">发起者</span>
	<span class="input-value"><a-input v-model:value="activity.laucher"></a-input></span>
</div>
<div class="input-item">
	<span class="input-key">起止时间</span>
	<span class="input-value"><a-range-picker show-time v-model:value="timeRange"/></span>
</div>
<div class="input-item">
	<span class="input-key">限购票数</span>
	<span class="input-value"><a-input-number :min="1" :max="5" v-model:value="activity.limitNum"/></span>
</div>
<div class="action">
	<a-button type="primary" @click="submit">确认</a-button>
	<a-button @click="emits('cancel')">取消</a-button>
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
	width: 400px;
	margin: 0 auto;
}
.input-key{
	width: 90px;
	display: inline-block;
}
.input-value{
	width: 300px;
	display: inline-block;
	margin-left: 10px;
	margin-bottom: 20px;
}
</style>