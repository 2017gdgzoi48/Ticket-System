<script setup>
import {ref} from 'vue';
import {Toast} from 'vant';
import activityList from './activityList.vue';
import axios from '../../inc/axios.js'; 
import {httpPort} from '../../inc/config.js';

const list=ref([]);
const logoURL=`http://${location.hostname}:${httpPort}/api/getLogo`;
const refreshing=ref(false);
let inited=false;
let loading=Toast.loading({
	message: '加载中...',
	forbidClick: true,
});

function refresh(){
	axios.get('/api/getAllActivity').then(res=>{
		if(!inited)refreshing.value=false;
		else inited=true;
		list.value=res.data;
		loading.clear();
	}).catch(({code,msg})=>{
		Toast(`操作失败，请联系管理员\ncode: ${code}\nmsg: ${msg}`);
		return ;
	})
}
refresh();
</script>

<template>
<div class="top-icon">
	<img :src="logoURL"/>
</div>
<div class="activity-list">
	<van-pull-refresh @refresh="refresh" v-model="refreshing">
		<activity-list :list="list"></activity-list>
	</van-pull-refresh>
</div>
</template>

<style scoped>
.top-icon img{
	max-height: 15vh;
	max-width: 80vw;
	padding: 0 5vw;
	margin-top: 20px;
}
.top-icon{
	text-align: center;
}
</style>