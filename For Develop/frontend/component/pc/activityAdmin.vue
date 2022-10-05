<script setup>
import {ref,reactive} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 
import {getImageURL} from '../../inc/util.js';

import editSimple from './editSimple.vue';
import editArticle from './editArticle.vue';
import editArea from './editArea.vue';
import round2 from './round2.vue';

const emits=defineEmits(['create-activity']);
const list=ref([]);
const editStatus=ref(-1);
const currentActivity=ref({});

var hide=message.loading();
function getData(){
	axios.get('/api/getAllActivity').then(res=>{
		hide();
		message.success('拉取信息成功！');
		list.value=res.data;
	}).catch(({code,msg})=>{
		hide();
		message.error(`拉取信息失败！${code}-${msg}`);
	})
}
getData();

function removeActivity(aid){
	let hide=message.loading();
	axios.get('/api/deleteActivity',{
		params:{aid}
	}).then(res=>{
		hide();
		message.success('删除成功！');
		getData();
	}).catch(({code,msg})=>{
		hide();
		message.error(`删除失败！${code}-${msg}`);
	});
}

function removeConfirm(aid){
	Modal.confirm({
		onOk:()=>removeActivity(aid),
		content:'确认要删除吗？',
		okType:'danger'
	})
}

function changeEditStatus(idx,status){
	if(status==2&&getState(idx)!==1){
		message.info('只能在活动开始前更改区域信息');
		return;
	}
	if(status==3&&getState(idx)!==3){
		message.info('只能在活动结束后进入第二轮卖票');
		return;
	}
	// debugger;
	editStatus.value=status;
	currentActivity.value=list.value[idx];
}

function submit(){
	currentActivity.value={};
	editStatus.value=-1;
	getData();
}

function cancel(){
	editStatus.value=-1;
}

function getState(idx){
	let openTime=list.value[idx].openTime,closeTime=list.value[idx].closeTime;
	openTime=new Date(openTime),closeTime=new Date(closeTime);
	let now=Date.now();
	if(openTime>now)return 1;
	else if(openTime<now&&closeTime>now)return 2;
	else return 3;
}
;
</script>

<template>
<div v-if="editStatus==-1">
	<div class="new-activity">
		<a-button type="primary" @click="emits('create-activity')">新建活动</a-button>
	</div>
	<keep-alive>
		<div class="card" v-for="(activity,idx) in list">
			<a-card hoverable>
				<template #cover>
					<a-carousel autoplay>
						<div v-for="poster in activity.posterImg" class="swipe-img">
							<img :src="getImageURL(poster)">
						</div>
					</a-carousel>
				</template>
				<template #actions>
					<span @click="changeEditStatus(idx,0)">编辑基本信息</span>
					<span @click="changeEditStatus(idx,1)">编辑文案</span>
					<span @click="changeEditStatus(idx,2)">编辑区域</span>
					<span @click="changeEditStatus(idx,3)">进入第二轮</span>
					<span class="danger-btn" @click="removeConfirm(activity.aid)">删除活动</span>
				</template>
				<a-card-meta :title="activity.activityName">
					<template #description class="description">
						<a-typography-paragraph ellipsis :content="activity.description"/>
					</template>
				</a-card-meta>
			</a-card>
		</div>
	</keep-alive>
	<div class="empty">
		<a-empty v-if="list.length==0"></a-empty>
	</div>
</div>
<div class="editor">
	<edit-simple v-if="editStatus==0" :activity="currentActivity" @submit="submit" @cancel="cancel"></edit-simple>
	<edit-article v-if="editStatus==1" :activity="currentActivity" @submit="submit" @cancel="cancel"></edit-article>
	<edit-area v-if="editStatus==2" :activity="currentActivity" @submit="submit" @cancel="cancel"></edit-area>
	<round2 v-if="editStatus==3" :aid="currentActivity.aid" @submit="submit" @cancel="cancel"></round2>
</div>

</template>

<style scoped>
.card{
	height: fit-content;
	width: 60vw;
	margin: 20px auto;
}
.swipe-img img{
	height: 200px;
	margin: 0 auto;
}
.empty{
	margin-top: 30px;
}
.danger-btn{
	color: red;
}
.new-activity{
	margin: 30px auto;
	text-align: center;
}
.editor{
	width: 60vw;
	margin: 30px auto;
}
</style>