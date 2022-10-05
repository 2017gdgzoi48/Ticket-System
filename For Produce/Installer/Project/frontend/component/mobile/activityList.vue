<script setup>
import {Toast,ImagePreview} from 'vant';
import {ref,reactive,defineProps,defineEmits} from 'vue';
import {getImageURL} from '../../inc/util.js';
import axios from '../../inc/axios.js';
const showDetail=ref(null);
const props=defineProps(["list"]);
// console.log(getImageURL)

function buyTicket(idx){
	axios.get('/api/getUser').then(res=>{
		let {level}=res.data;
		if(getState(idx)==1&&level<1){
			Toast('活动尚未开始')
			return ;
		}else if(getState(idx)==3&&level<1){
			Toast('活动已经结束')
			return;
		}
		if(props.list[idx].mode==1)location.assign('buyTicket.html?aid='+props.list[idx].aid);
		if(props.list[idx].mode==2)location.assign('buyTicket2.html?aid='+props.list[idx].aid);
	})
}

function getState(idx){
	let {openTime,closeTime}=props.list[idx];
	openTime=new Date(openTime),closeTime=new Date(closeTime);
	let now=Date.now();
	if(openTime>now)return 1;
	else if(openTime<now&&closeTime>now)return 2;
	else return 3;
}
</script>

<template>
<div v-if="list.length!==0">
	<div class="activity-card"  v-for="(activity,idx) in list">
		<van-swipe :autoplay="3000" lazy-render class="activity-swipe" @click="buyTicket(idx)">
			<van-swipe-item v-for="image in activity.posterImg" :key="image">
				<div :style="{background:`url(${getImageURL(image)})`}" class="activity-img" />
			</van-swipe-item>
		</van-swipe>
		<div class="activity-info">
			<span class="activity-name" @click="buyTicket(idx)">
				{{activity.activityName}}
			</span>
			<span class="activity-operation">
				<van-icon name="more-o" color="grey" size="20" @click="showDetail=activity" id="show-more-info"/>
			</span>
		</div>
		<div class="activity-laucher">活动由{{activity.laucher}}举办</div>
		<div class="activity-time" @click="buyTicket(idx)">
			<span v-if="getState(idx)==1">
				开始时间：{{new Date(activity.openTime).toLocaleString()}}
				<van-tag type="warning" size="small">未开始</van-tag>
			</span>
			<span v-if="getState(idx)==2">
				结束时间：{{new Date(activity.closeTime).toLocaleString()}}
				<van-tag mark plain color="#5983ff" size="small">进行中</van-tag>
			</span>
			<span v-if="getState(idx)==3">
				<van-tag mark plain type="warning" size="small">已结束</van-tag>
			</span>
		</div>
	</div>
</div>
<div v-else>
	<van-empty image="error" description="暂时没有活动" />
</div>
<div id="description">
	<van-action-sheet v-model:show="showDetail" title="详细信息" @close="showDetail=null">
		<div class="activity-description">
			<strong>详细介绍</strong>
			<div>{{showDetail?.description}}</div>
			<br>
			<strong>场地图（轻触以放大）</strong>
			<div class="activity-background" v-if="showDetail?.background" @click="ImagePreview([getImageURL(showDetail.background)])">
				<div :style="{backgroundImage:`url(${getImageURL(showDetail.background)})`}"></div>
			</div>
		</div>
	</van-action-sheet>
</div>
</template>

<style scoped>
.activity-laucher{
	font-family: "Microsoft YaHei UI",serif;
	font-weight:bold;
	color: #8a8a8e;
	font-size: 13px;
	line-height: 22px;
	flex: 4;
	margin-left: 15px;
}
.activity-card{
	box-shadow: 0px 20px 40px #e6f2ff, inset 3px 3px 10px rgb(247, 248, 250);
	border-radius: 20px;
	background-color: white;
	width: 80vw;
	margin: 25px auto;
	height: fit-content;
	padding-bottom: 10px;
	overflow: scroll;
}
.activity-img{
	height: 150px;
	width: 80vw;
	background-size: cover !important;
}
.activity-swipe{
	margin: 3px auto;
	display: block;
	text-align: center;
}
.activity-card:last-child{
	margin-bottom: 100px;
}
.activity-info{
	height: 40px;
	display: flex;
	line-height: 40px;
}
.activity-name{
	font-weight: bold;
	font-size: 23px;
	line-height: 41px;
	flex: 4;
	margin-left: 15px;
	letter-spacing: 0.5px;
}
.activity-operation{
	flex: 1;
	margin-right: 10px;
	text-align: right;
}
.activity-operation .van-button{
	vertical-align: text-bottom;
	margin-right: 5px;
}
.activity-description{
	height: 300px;
	white-space: pre-wrap;
	padding: 0 30px;
	color: #8a8a8e;
}
.activity-background{
	height: 100%;
	width: 100%;
}
.activity-background>div{
	background-size: cover;
	height: 100%;
	width: 100%;
}
.activity-time{
	color: #8a8a8e;
	/* -top: 1px solid grey;*/
	width: 90%;
	margin-top:0;
	margin-left: 15px;
	margin-bottom: 10px;
	padding-top: 10px;
	font-size: small;
	text-align: left;
}
</style>