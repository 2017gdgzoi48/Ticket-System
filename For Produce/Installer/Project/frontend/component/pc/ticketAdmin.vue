<script setup>
import {ref,reactive} from 'vue';
import {message,Modal} from 'ant-design-vue';
import axios from '../../inc/axios.js';
import {httpPort} from '../../inc/config.js';

const ticketData=ref([]);
const showData=ref([]);
const userColumn=ref([
	{
		title: 'ID',
		dataIndex: 'tid',
		key: 'tid',
	},
	{
		title: '支付者卡号',
		dataIndex: 'payer',
		key: 'payer',
	},
	{
		title: '支付者ID',
		dataIndex: 'payerId',
		key: 'payerId',
	},
	{
		title: '活动ID',
		dataIndex: 'aid',
		key: 'aid'
	},
	{
		title: '选区',
		dataIndex: 'areaName',
		key: 'areaName',
	},
	{
		title: '行',
		dataIndex: 'row',
		key: 'row',
	},
	{
		title: '列',
		dataIndex: 'col',
		key: 'col',
	},
	{
		title: '支付时间',
		dataIndex: 'time',
		key: 'time',
	},
	{
		title: '凭证',
		dataIndex: 'token',
		key: 'token',
	},
	{
		title: '是否已使用',
		dataIndex: 'used',
		key: 'used',
	},
	{
		title:'操作',
		key:'action'
	}
]);

const filterName=ref('payer');
const filterValue=ref('');
const aid=ref('');

function getData(){
	let hide=message.loading();
	axios.get('/api/getAllTicket').then(res=>{
		ticketData.value=res.data.map(ele=>{
			let {areaName,row,col}=ele.content;
			delete ele.content;
			ele.used=(ele.used?'已使用':'未使用');
			ele.time=new Date(ele.time).toLocaleString();
			ele.payerId=ele.payer.uid;
			ele.payer=ele.payer.cardid+ele.payer.schoolType;
			return {
				...ele,
				areaName,row,col
			};
		});
		refresh();
	}).catch(({code,msg})=>{
		hide();
		message.error(`拉取失败！${code}-${msg}`);
	})
}
getData();

function refresh(filter=false){
	if(!filter){
		showData.value=ticketData.value;
		filterValue.value='';
	}
	else{
		showData.value=ticketData.value.filter(user=>{
			// console.log(filterName.value,filterValue.value);
			return user[filterName.value]?.toString()?.includes(filterValue.value.toString());
		});
	}
}


function clearOld(aid){
	if(!aid)return;
	let model=Modal.confirm({
		content:`您确定要删除活动ID为${aid}的所有未使用订单吗？`,
		okType:'danger',
		title:'确认删除',
		cancelText:'取消',
		onOk:function(){
			let hide=message.loading();
			axios.get('/api/clearOldTicket',{
				params:{
					aid
				}
			}).then(res=>{
				hide();
				getData();
				message.success('删除成功！');
			}).catch(({code,msg})=>{
				hide();
				message.error(`删除失败！${code}-${msg}`);
				getData();
			})
		}
	});
}

function deleteTicket(tid){
	Modal.confirm({
		content:`您确定要删除这张订单吗？`,
		okType:'danger',
		title:'确认删除',
		cancelText:'取消',
		onOk:function(){
			let hide=message.loading();
			axios.get('/api/returnTicket',{
				params:{
					tid
				}
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


function useTicket(tid){
	let hide=message.loading();
	axios.get('/api/useTicket',{
		params:{
			tid
		}
	}).then(res=>{
		hide();
		message.success('修改成功！');
		getData();
	}).catch(({code,msg})=>{
		hide();
		message.error(`修改失败！${code}-${msg}`);
		getData();
	})
}

function exportTable(){
	let a=document.createElement('a');
	a.href=`http://${location.hostname}:${httpPort}/api/exportTicketTable`;
	a.download='票数据.xlsx';
	a.click();
}
</script>

<template>
<div class="action">
	<div class="search-name">
		搜索：
		<a-select v-model:value="filterName" class="input-key">
			<a-select-option value="payerId">支付者ID</a-select-option>
			<a-select-option value="payer">支付者卡号</a-select-option>
			<a-select-option value="aid">活动ID</a-select-option>
			<a-select-option value="openid">订单ID</a-select-option>
			<a-select-option value="areaName">选区</a-select-option>
			<a-select-option value="token">凭证</a-select-option>
		</a-select>
		<a-input v-model:value="filterValue" class="input-val" placeholder="搜索……"></a-input>
		<a-button type="primary" @click="refresh(true)">搜索</a-button>
		<a-button  @click="refresh()">取消</a-button>
	</div>
	<div class="export-btn">
		<a-button type="primary" @click="exportTable">导出成excel</a-button>
	</div>
	<div class="delete-user">
		删除旧订单：
		<a-input v-model:value="aid" class="input-val" placeholder="清除某一活动未使用的订单"></a-input>
		<a-button type="danger" @click="clearOld(aid)">删除</a-button>
	</div>
</div>
<a-table :dataSource="showData" :columns="userColumn" :pagination="{position:['bottomCenter']}">
	<template #bodyCell="{column,record}">
		<span v-if="column.key=='action'">
			<a @click="useTicket(record.tid)">标记为已使用</a>
			<a-divider type="vertical"  />
			<a @click="deleteTicket(record.tid)">删除</a>
		</span>
	</template>
</a-table>
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
	width: 100px;
	display: inline-block;
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