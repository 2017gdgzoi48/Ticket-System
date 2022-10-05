<script setup>
import dayjs from 'dayjs';
import {ref,reactive} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 
import {getImageURL} from '../../inc/util.js';
import {CloseCircleFilled} from '@ant-design/icons-vue';

const props=defineProps(['activity']);
const emits=defineEmits(['submit','cancel']);
const uploadImg=ref([]);
const activity=ref(props.activity);

function submit(){
	let fd=new FormData();
	let hide=message.loading();
	uploadImg.value.forEach(poster=>{
		fd.append('posterImg',poster.originFileObj)
	});
	axios.post('/api/uploadPoster',fd,{
		params:{aid:activity.value.aid}
	}).then(res=>{
		let fd=new FormData();
		fd.append('description',activity.value.description);
		return axios.post('/api/updateActivity',fd,{
			params:{aid:activity.value.aid}
		})
	}).then(res=>{
		hide();
		message.success('修改成功！');
		// emits('submit');
	}).catch(({code,msg})=>{
		hide();
		message.error(`修改失败！${code}-${msg}`);
	})
}
function removePoster(poster){
	let hide=message.loading();
	axios.get('/api/removePoster',{
		params:{
			removeName:poster,
			aid:activity.value.aid
		}
	}).then(res=>{
		hide();
		message.success('删除成功');
		activity.value.posterImg=activity.value.posterImg.filter(ele=>{
			return ele!==poster
		})
	}).catch(({code,msg})=>{
		hide();
		message.error(`删除失败！${code}-${msg}`);
	})
}

;
</script>

<template>
<div class="showPoster upload">
	<span class="input-key">删除海报</span>
	<span class="input-value">
		<a-badge v-for="poster in activity.posterImg">
			<template #count>
				<close-circle-filled  style="color: #f5222d" @click="removePoster(poster)"/>
			</template>
			<div class="poster">
				<a-image :src="getImageURL(poster)"></a-image>
			</div>
		</a-badge>
	</span>
</div>
<div class="upload">
	<span class="input-key">增加海报</span>
	<span class="input-value">
		<a-upload list-type="picture-card" v-model:file-list="uploadImg" multiple>
			上传
		</a-upload>
	</span>
</div>
<div class="input-item">
	<span class="input-key textarea">活动描述</span>
	<span class="input-value"><a-textarea show-count :maxlength="1000" v-model:value="activity.description" /></span>
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
.upload{
	width: fit-content;
	margin: 0 auto;
	display: flex;
	min-width: 400px;
}
.upload .input-value{
	width: fit-content;
	max-width: 60vw;
}
.showPoster .input-value>*{
	margin-right: 20px;
}
.poster{
	width: 120px;
	height: 120px;
	overflow: hidden;
}
</style>