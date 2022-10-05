<script setup>
import {ref,reactive} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js';
import {httpPort} from '../../inc/config.js';
import {schoolLevelByText,getUserPhotoURL} from '../../inc/util.js'; 

const userData=ref([]);
const showData=ref([]);
const userColumn=ref([
	{
		title:'ID',
		dataIndex:'uid',
		key:'uid',
	},
	{
		title: 'OPENID',
		dataIndex: 'openid',
		key: 'openid',
	},
	{
		title: '姓名',
		dataIndex: 'realName',
		key: 'realName',
	},
	{
		title: '卡号',
		dataIndex: 'cardid',
		key: 'cardid',
		sorter:(a,b)=>Number(a.cardid)-Number(b.cardid)
	},
	{
		title: '照片',
		dataIndex: 'photo',
		key: 'photo',
	},
	{
		title: '所属',
		dataIndex: 'schoolText',
		key: 'schoolText',
		filters:[
	      {text:'初中部',value:'初中部'},
	      {text:'高中部',value:'高中部'},
	      {text:'未指定',value:'未指定'},
	      {text:'管理员',value:'管理员'}
	    ],
	    onFilter:function(value,record){	
	    	return record.schoolText==value;
	    }	
	},
	{
		title:'操作',
		key:'action'
	}
]);

const filterName=ref('cardid');
const filterValue=ref('');
const enchanceYear=ref('');
const visible=ref(false);
const updateVal=ref({});

function getData(){
	let hide=message.loading();
	axios.get('/api/getAllUser').then(res=>{
		userData.value=res.data;
		refresh();
	}).catch(({code,msg})=>{
		hide();
		message.error(`拉取失败！${code}-${msg}`);
	})
}
getData();

function refresh(filter=false){
	if(!filter){
		showData.value=userData.value;
		filterValue.value='';
	}
	else{
		showData.value=userData.value.filter(user=>{
			return user[filterName.value]?.toString()?.includes(filterValue.value.toString());
		});
	}
}

function clearOld(enchanceYear){
	if(!enchanceYear)return;
	let data=userData.value.filter(user=>{
		return user.enchanceYear==Number(enchanceYear);
	});
	let model=Modal.confirm({
		content:`您确定要删除${enchanceYear}届（${enchanceYear}年入学）的所有学生的数据吗？`,
		okType:'danger',
		title:'确认删除',
		cancelText:'取消',
		onOk:function(){
			let promiseArr=[];
			let hide=message.loading();
			data.forEach(user=>{
				promiseArr.push(axios.get('/api/deleteUser',{
					params:{
						uid:user.uid
					}
				}));
			});
			Promise.all(promiseArr).then(()=>{
				hide();
				message.success('删除成功！');
				getData();
			}).catch(({code,msg})=>{
				hide();
				message.error(`删除失败！${code}-${msg}`);
				getData();
			})
		}
	});
}

function deleteUser(uid){
	Modal.confirm({
		content:`您确定要删除该学生吗？`,
		okType:'danger',
		title:'确认删除',
		cancelText:'取消',
		onOk:function(){
			let hide=message.loading();
			axios.get('/api/deleteUser',{
				params:{uid}
			}).then(res=>{
				hide();
				getData();
				message.success('删除成功！');
			}).catch(({code,msg})=>{
				hide();
				message.error(`删除失败！${code}-${msg}`);
			})
		}
	});
}

function updateUser(record){
	updateVal.value=reactive(record);
	visible.value=true;
}

function submitInfo(){
	visible.value=false;
	let {cardid,realName,schoolText,uid}=updateVal.value;
	let hide=message.loading();
	axios.get('/api/updateUser',{
		params:{
			uid,cardid,realName,
			schoolType:schoolLevelByText[schoolText]
		}
	}).then(res=>{
		hide();
		message.success('修改成功！');
	}).catch(({code,msg})=>{
		hide();
		message.error(`修改失败！${code}-${msg}`);
	})
}

function openPhoto(uid){
	window.open(getUserPhotoURL(uid));
}

function exportTable(){
	let a=document.createElement('a');
	a.href=`http://${location.hostname}:${httpPort}/api/exportUserTable`;
	a.download='用户数据.xlsx';
	a.click();
}
</script>

<template>
<div class="action">
	<div class="search-name">
		搜索：
		<a-select v-model:value="filterName" style="width: 90px" class="input-key">
			<a-select-option value="cardid">卡号</a-select-option>
			<a-select-option value="realName">姓名</a-select-option>
			<a-select-option value="openid">OPENID</a-select-option>
			<a-select-option value="uid">ID</a-select-option>
		</a-select>
		<a-input v-model:value="filterValue" class="input-val" placeholder="搜索……"></a-input>
		<a-button type="primary" @click="refresh(true)">搜索</a-button>
		<a-button  @click="refresh()">取消</a-button>
	</div>
	<div class="export-btn">
		<a-button type="primary" @click="exportTable">导出成excel</a-button>
	</div>
	<div class="delete-user">
		删除旧数据：
		<a-input v-model:value="enchanceYear" class="input-val" placeholder="清除某一届的学生"></a-input>
		<a-button type="danger" @click="clearOld(enchanceYear)">删除</a-button>
	</div>
</div>
<a-table :dataSource="showData" :columns="userColumn" :pagination="{position:['bottomCenter']}">
	<template #bodyCell="{column,record}">
		<span v-if="column.key=='action'">
			<a @click="updateUser(record)">更改</a>
			<a-divider type="vertical"  />
			<a @click="deleteUser(record.uid)">删除</a>
		</span>
		<span v-if="column.key=='photo'">
			<a-button type="link" @click="openPhoto(record.uid)">查看</a-button>
		</span>
	</template>
</a-table>
<a-modal v-model:visible="visible" title="修改信息" class="update-info" @ok="submitInfo">
	<span>
		姓名： <a-input v-model:value="updateVal.realName" class="input-val"></a-input>
	</span>
	<br>
	<span>
		卡号： <a-input v-model:value="updateVal.cardid" class="input-val"></a-input>
	</span>
	<br>
	<span>
		所属： 
		<a-radio-group v-model:value="updateVal.schoolText">
			<a-radio-button value="初中部">初中部</a-radio-button>
			<a-radio-button value="高中部">高中部</a-radio-button>
			<a-radio-button value="未指定">未指定</a-radio-button>
			<a-radio-button value="管理员">管理员</a-radio-button>
		</a-radio-group>
	</span>
</a-modal>
</template>

<style scoped>
.action{
	display: flex;
	align-items: center;
}
.action>*{
	flex: 1;
	margin: 20px 20px;
}
.action>*>*{
	margin-right: 10px;
}
.export-btn{
	width: fit-content;
	flex: 0;
}
.input-key{
	width: 30%;
}
.input-val{
	display: inline-block;
	width: 200px;
}
.ant-pagination{
	margin-right: 30px !important;
}
.update-info span{
	margin-bottom: 10px;
	display: inline-block;
}
</style>