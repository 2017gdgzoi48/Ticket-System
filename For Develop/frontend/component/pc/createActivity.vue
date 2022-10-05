<script setup>
import {ref,reactive,computed} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 
import pako from 'pako';
import {PlusCircleOutlined} from '@ant-design/icons-vue';
import seatmapEditor from './seatmapEditor.vue';

const currentStep=ref(0);

const activityName=ref('');
const laucher=ref('');
const time=ref([]);
const limitNum=ref(2);
const mode=ref(1);
const posterImg=ref([]);
const description=ref('');
// const areaImg=ref([]);
const areaList=ref([]);
const seatMap=ref('');
const currentArea=ref({});
const visible=ref(false);
const background=ref([]);
// const size=ref([]);


// function ungzip(str){
// 	str='['+atob(str)+']';
// 	str=JSON.parse(str);
// 	str=new Uint8Array(str);
// 	var result=pako.ungzip(str,{to:'string'});
// 	return result;
// }

function checkIsEmpty(){
	return laucher.value && activityName.value && description.value && time.value.length && areaList.value.length;
}

function createConfig(){
	let activityConfig={
		laucher:laucher.value,
		activityName:activityName.value,
		limitNum:Number(limitNum.value),
		description:description.value,
		openTime:time.value[0].$d,
		closeTime:time.value[1].$d,
		seatMap:seatMap.value,
		mode:mode.value
	};
	let fd=new FormData();
	posterImg.value.forEach(poster=>{
		fd.append('posterImg',poster.originFileObj);
	})
	fd.append('background',background.value[0].originFileObj);
	let areaConfigStr=JSON.stringify(areaList.value.map(area=>{
		area.color=area.color.slice(1);
		return area;
	}));
	let areaConfig=new FormData();
	areaConfig.append('areaArr',areaConfigStr);
	return {
		activityConfig,
		files:fd,
		areaConfig
	}
}

function createActivity(){
	if(!checkIsEmpty()){
		Modal.warning({
			content:'配置未完善，请检查'
		});
		return;
	}
	currentStep.value=-1;
	let {activityConfig,files,areaConfig}=createConfig();
	let hide=message.loading('提交中');
	axios.post('/api/createActivity',files,{
		params:activityConfig,
	}).then(res=>{
		let {aid}=res.data;
		console.log(aid);
		message.success('活动创建成功！');
		return axios.post('/api/setArea',areaConfig,{
			params:{aid}
		});
	}).then(res=>{
		hide();
		message.success('区域创建成功！');
		currentStep.value=4;
	}).catch(({code,msg})=>{
		hide();
		message.error(`操作失败！${code}-${msg}`);
	})
}

function confirmCreate(){
	Modal.confirm({
		title:'确认活动',
		content:'确认创建活动吗？\n活动一旦创建，选区的形状颜色将不可修改。',
		onOk:createActivity
	})
}

function addOneArea(){
	areaList.value.push({
		areaName:'区域',
		color:'#FFFFFF',
		price:10
	})
}
function openEditor(idx){
	currentArea.value=areaList.value[idx];
	visible.value=true;
}
function closeEditor(){
	visible.value=false;
	currentArea.value={};
}
function removeArea(idx){
	areaList.value=[...areaList.value.slice(0,idx),...areaList.value.slice(idx+1)];
}
</script>

<template>
<div class="step">
	<a-steps :current="currentStep">
		<a-step title="输入基本信息" description="输入活动的名字等，将初步创建活动"></a-step>
		<a-step title="设置宣传文案" description="上传海报，输入描述"></a-step>
		<a-step title="设置选区" description="设置各个选区和座位"></a-step>
		<a-step title="上色" description="设置座位对应的信息"></a-step>
	</a-steps>
</div>
<div class="content">
	<div v-if="currentStep==0">
		<div class="input-item">
			<span class="input-key">活动名称</span>
			<span class="input-value"><a-input v-model:value="activityName"></a-input></span>
		</div>
		<div class="input-item">
			<span class="input-key">发起者</span>
			<span class="input-value"><a-input v-model:value="laucher"></a-input></span>
		</div>
		<div class="input-item">
			<span class="input-key">起止时间</span>
			<span class="input-value"><a-range-picker show-time v-model:value="time"/></span>
		</div>
		<div class="input-item">
			<span class="input-key">限购票数</span>
			<span class="input-value"><a-input-number :min="1" :max="5" v-model:value="limitNum"/></span>
		</div>
		<div class="input-item">
			<span class="input-key">购买模式</span>
			<span class="input-value">
				<a-select v-model:value="mode">
					<a-select-option :value="1">个人选座</a-select-option>
					<a-select-option :value="2">自动分配</a-select-option>
				</a-select>
			</span>
		</div>
	</div>
	<div v-if="currentStep==1">
		<div class="upload">
			<span class="input-key">上传海报</span>
			<span class="input-value">
				<a-upload list-type="picture-card" v-model:file-list="posterImg" multiple>
					上传
				</a-upload>
			</span>
		</div>
		<div class="upload">
			<span class="input-key">上传选区图</span>
			<span class="input-value">
				<a-upload list-type="picture-card" v-model:file-list="background" >
					<span v-if="background.length==0">上传</span>
				</a-upload>
			</span>
		</div>
		<div class="input-item">
			<span class="input-key textarea">活动描述</span>
			<span class="input-value"><a-textarea show-count :maxlength="1000" v-model:value="description"/></span>
		</div>
	</div>
	<div v-if="currentStep==2">
		<div class="input-item">
			<span class="input-key textarea">SeatMap</span>
			<span class="input-value"><a-textarea show-count v-model:value="seatMap"/></span>
		</div>
		<div class="input-item">
			<span class="input-key textarea">区域列表</span>
			<span class="input-value">
				<a-list :data-source="areaList">
					<template #loadMore>
						<div class="addone-btn">
							<a-button @click="addOneArea">
								<plus-circle-outlined />增加一个区域
							</a-button>
						</div>
					</template>
					<template #renderItem="{item,index}">
						<a-list-item>
							<a-list-item-meta>
								<template #title>
									{{item.areaName}}
								</template>
						    </a-list-item-meta>
						    <template #actions>
					            <a key="list-loadmore-edit" @click="openEditor(index)">edit</a>
					            <a key="list-loadmore-more" @click="removeArea(index)">remove</a>
						    </template>
				        </a-list-item>
				    </template>
				</a-list>
			</span>
		</div>
	</div>
	<div v-if="currentStep==3">
		<seatmap-editor v-model:seat-map-str="seatMap" :area-list="areaList"></seatmap-editor>
	</div>
	<div v-if="currentStep==4" class="ok">
		OK
	</div>
</div>
<div class="action" v-if="currentStep!==4">
	<a-button type="primary" v-if="currentStep==-1" @click="currentStep=0">Retry</a-button>
	<a-button type="primary" v-else-if="currentStep<3" @click="currentStep+=1">Next</a-button>
	<a-button type="primary" v-else @click="createActivity">OK</a-button>
	<a-button v-if="currentStep>0" @click="currentStep-=1">Previous</a-button>
</div>
<a-drawer v-model:visible="visible" placement="right" title="编辑区域" @close="closeEditor">
	<div class="input-item drawer">
		<span class="input-key">区域名称</span>
		<span class="input-value"><a-input v-model:value="currentArea.areaName"></a-input></span>
	</div>
	<div class="input-item drawer">
		<span class="input-key">区域价格</span>
		<span class="input-value"><a-input-number v-model:value="currentArea.price" :max="100" :min="0"></a-input-number></span>
	</div>
	<div class="input-item drawer">
		<span class="input-key textarea">选区颜色</span>
		<span class="input-value">
			<input type="color" v-model="currentArea.color">
		</span>
	</div>
</a-drawer>
</template>

<style scoped>
.step{
	padding: 30px 10vw;
}
.content{
	margin: 30px auto;
	width: calc(90vw - 60px);
}
.action{
	text-align: center;
	margin-bottom: 30px;
}
.action>:first-child{
	margin-right: 30px;
}
.input-item,.input-list{
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
.drawer{
	width: 300px;
}
.drawer .input-value{
	width: 200px;
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
.input-key.textarea{
	vertical-align: top;
}
.addone-btn{
	text-align: center;
	margin-top: 10px;
}
[id*=path]:hover{
	filter: brightness(3.0);
	cursor: pointer;
}
.ok{
	text-align: center;
	font-size: 40px;
	margin: 30px auto;
}
</style>