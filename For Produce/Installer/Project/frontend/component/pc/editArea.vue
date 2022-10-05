<script setup>
import {ref,reactive,computed,watch} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js'; 
import seatmapEditor from './seatmapEditor.vue';

const props=defineProps(['activity']);
const emits=defineEmits(['submit','cancel']);
const seatMap=ref(''),areaList=ref([]);
// console.log(props.activity);
const visible=ref(false);
const currentArea=ref({});

function getData(aid){
	if(!aid)return;
	let hide=message.loading();
	axios.get('/api/getActivityInfo',{
		params:{aid},
	}).then(res=>{
		hide();
		seatMap.value=res.data.seatMap;
		areaList.value=res.data.area;
	}).catch(({code,msg})=>{
		hide();
		message.error(`拉取失败！${code}-${msg}`);
	})
}
getData(props.activity.aid);
watch(()=>props.activity,({aid})=>{
	getData(aid);
})

function openEditor(idx){
	currentArea.value=areaList.value[idx];
	visible.value=true;
}
function closeEditor(){
	visible.value=false;
	currentArea.value={};
}

function submit(){
	let hide=message.loading();
	let reqArr=areaList.value.map(area=>{
		let fd=new FormData();
		fd.append('price',area.price);
		fd.append('color',area.color.slice(1));
		fd.append('areaName',area.areaName);
		let req=axios.post('/api/updateArea',fd,{
			params:{areaid:area.areaid}
		});
		return req;
	});
	let fd=new FormData();
	fd.append('seatMap',seatMap.value);
	reqArr.push(axios.post('/api/updateActivity',fd,{
		params:{aid:props.activity.aid}
	}))
	Promise.all(reqArr).then(()=>{
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
<div>
	<div class="input-item">
		<span class="input-key textarea">SeatMap</span>
		<span class="input-value"><a-textarea show-count v-model:value="seatMap"/></span>
	</div>
	<div class="input-item">
		<span class="input-key textarea">区域列表</span>
		<span class="input-value">
			<a-list :data-source="areaList">
				<template #renderItem="{item,index}">
					<a-list-item>
						<a-list-item-meta>
							<template #title>
								{{item.areaName}}
							</template>
					    </a-list-item-meta>
					    <template #actions>
				            <a key="list-loadmore-edit" @click="openEditor(index)">edit</a>
					    </template>
			        </a-list-item>
			    </template>
			</a-list>
		</span>
	</div>
	<seatmap-editor v-model:seat-map-str="seatMap" :area-list="areaList"></seatmap-editor>
</div>
<div class="action">
	<a-button type="primary" @click="submit">确认</a-button>
	<a-button @click="emits('cancel')">取消</a-button>
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
.action{
	text-align: center;
	margin-top: 30px;
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
.area-name{
	font-size: 30px;
	position: relative;
	display: block;
	width: fit-content;
	opacity: 0;
	z-index: 2;
	pointer-events: none;
	height: 40px;
	line-height: 40px;
	margin-bottom: -40px;
}
[id*=path]:hover{
	filter: brightness(3.0);
	cursor: pointer;
}
</style>