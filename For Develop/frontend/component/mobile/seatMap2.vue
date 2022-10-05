<script setup>
import seatItem2 from './seatItem2.vue';
import scaleContainer from './scaleContainer.vue';
import {getImageURL} from '../../inc/util.js';
import {ref,computed,reactive,watch} from 'vue';
import {Toast} from 'vant';
const props=defineProps(["activity","seatMap","chooseTicket","loaded"]);
const emits=defineEmits(["addOne","minusOne"]);

const blinkAreaid=ref(-1);
const alignStyle=computed(()=>{
	let activity=props.activity;
	if(!activity.seatMap)return '';
	// console.log(props.seatMap);
	let style=activity.seatMap.style;
	return (style=='center'?'center':(style=='left'?'flex-start':'flex-end'));
})

const viewPortSize=computed(()=>{
	if(!props.activity.seatMap)return [0,0];
	let {map:seatMap}=props.activity.seatMap;
	// console.log(seatMap);
	let h=50+seatMap.length*40;
	let w=70+Math.max(...seatMap.map(row=>{
		// console.log(row?.length);
		if(!row||row.length==1)return 0;
		return row.reduce((val,seat)=>{
			if(!seat)return 0;
			return val+35+seat.padding*17.5;
		},0)
	}));
	ok.value=true;
	let sw=innerWidth*0.9,sh=innerHeight*0.7;
	let scaleW=sw/w,scaleH=sh/h;
	let scaleMax=Math.max(scaleW,scaleH);
	let scaleMin=Math.min(scaleW,scaleH);
	// let scaleMax=scaleW,scaleMin=scaleH;
    let viewPortSize=[sw/scaleMin,sh/scaleMin];
    console.log(viewPortSize,[w,h],[sw,sh],[scaleMin,scaleMax],[scaleW,scaleH]);
    let defaultScale=scaleMax/scaleMin;
    // let defaultScale=1;	
    // let viewSize=[sw/scaleMax,sh/scaleMax];
    let defaultOffset=[(viewPortSize[0]-w)/2,(viewPortSize[1]-h)/2];
    console.log(defaultScale,defaultOffset);
    // console.log(defaultOffset);
    // let defaultOffset=[0,0];
    let offsetStyle={
    	transform:`translate(${defaultOffset[0]}px,${defaultOffset[1]}px)`,
    }
    let sizeStyle={
    	height:viewPortSize[1]+'px',
    	width:viewPortSize[0]+'px'
    }
    // defaultOffset[0]=(viewPortSize[0]-sw)/2;
	return {
		// viewSize,
		defaultScale,
		defaultOffset,
		offsetStyle,
		sizeStyle,
		// viewSize,
		viewPortSize
	};
})

const ok=ref(false);
const showOverlay=ref(false);
const nowArea=ref({});
// const alreadyChoose=reactive({});

function changeStatus(opr){
	opr.aid=props.activity.aid;
	emits('changeStatus',opr);
	if(opr.status=='c'){
		let [row,col]=opr.realPos;
		let areaid=props.activity.seatMap.map[row][col].area.areaid;
		blinkAreaid.value=areaid;
		setTimeout(()=>{
			blinkAreaid.value=-1;
		},100);
	}
}

function getByAreaid(areaid){
	return props.activity.seatMap.map.flat().filter(Boolean).filter(seat=>{
		if(typeof seat=="string")return false;
		return seat.area.areaid==areaid;
	});
}

function chooseArea(row,col){
	if(!props.loaded){
		Toast('尚未连接完毕');
		return;
	}
	let seat=props.activity.seatMap.map[row][col];
	console.log(row,col);
	if(!seat)return;
	let {area}=seat;
	blinkAreaid.value=area.areaid;
	setTimeout(()=>{
		blinkAreaid.value=-1;
	},100);
	setTimeout(()=>{
		showOverlay.value=true;
		nowArea.value=area;
		nowArea.value.remaining=computed(()=>{
			return getByAreaid(area.areaid).filter(seat=>{
				return props.seatMap[seat.row][seat.col]=='s';
			}).length;
		});
		// if(typeof alreadyChoose[area.areaid]=='undefined')alreadyChoose[area.areaid]=0;
		nowArea.value.alreadyChoose=computed(()=>{
			return props.chooseTicket.filter(ticket=>ticket.areaid==area.areaid).length;
		});
	},700);
}

function goBack(){
	history.go(-1);
}
;
</script>

<template>
<div class="main">
	<div class="nav-bar">
		<van-nav-bar title="买票" left-arrow @click-left="goBack()"/>
	</div>
	<div class="help-tip">
		<span class="left">左门</span>
		<span class="middle">舞台</span>
		<span class="right">右门</span>
	</div>
	<div class="full-screen">
		<scale-container :view-port-size="viewPortSize" :ok="ok">
			<template #simple="{scale}">
				<div class="cursor"></div>
				<div class="seat-map" :style="{alignItems:alignStyle,...viewPortSize.sizeStyle}">
					<div v-for="(seatRow,row) in activity.seatMap?.map.filter(Boolean)" :style="viewPortSize.offsetStyle">
						<template v-if="seatRow.length>1">
							<span v-for="(seat,col) in seatRow.filter(Boolean)">
								<seat-item2 :seat="seat" :status="(!!seatMap?seatMap[seat.row][seat.col]:'s')"  :blink-areaid="blinkAreaid" @click="chooseArea(row+1,col+1)"></seat-item2>
							</span>
						</template>
						<template v-else>
							<div class="row-text" :style="{width:viewPortSize.viewPortSize[0]*0.4+'px'}">{{seatRow[0]}}</div>
						</template>
					</div>
				</div>
			</template>
			<template #fixed="{scale}">
				<div class="row-num" :style="viewPortSize.offsetStyle">
					<div v-for="(ele,row) in activity.seatMap?.map.filter(Boolean)" class="row-num-item">
						<span v-if="ele.length>1">{{ele[1].row}}</span>
						<span v-else>-</span>
					</div>
				</div>
			</template>
		</scale-container>
	</div>
	<van-overlay :show="showOverlay">
		<div class="show-area-info">
			<div class="area-name">
				当前选择区域： <strong>{{nowArea.areaName}}</strong>区
			</div>
			<br>
			<div class="area-info">
				<span class="remaining-num">还剩下：<strong>{{nowArea.remaining}}</strong>个座位</span>
				<br>
				<span class="remaining-num">您已经选择：<strong>{{nowArea.alreadyChoose}}</strong>个座位</span>
				<br><br>
				<div class="buy-btn">
					<van-button type="primary" :disabled="!nowArea.remaining" @click="emits('addOne',nowArea.areaid)">选一个</van-button>
					<van-button type="danger" :disabled="!nowArea.alreadyChoose" @click="emits('minusOne',nowArea.areaid)">取消一个</van-button>
					<van-button type="default" @click="showOverlay=false">关闭</van-button>
				</div>
			</div>
		</div>
	</van-overlay>
</div>
</template>

<style scoped>
.cursor{
	transform: translate(0,0);
	transform-origin: 0 0;
	width: 20px;
	height: 20px;
	background: grey;
	display: none;
}
.main{
	display: flex;
	flex-direction: column;
}
.help-tip{
	display: flex;
	font-size: 30px;
	font-weight: bolder;
	pointer-events: none;
	height: 50px;
	line-height: 50px;
	width: 100%;
}
.left,.right,.middle{
	flex: 1;
}
.left{
	text-align: left;
	margin-left: 20px;
}
.right{
	text-align: right;
	margin-right: 20px;
}
.middle{
	text-align: center;
	border: 5px solid red;
	/*height: 40px;*/
	line-height: 40px;
}
.full-screen{
	height: 70vh;
	padding-left: 5vw;
}
.seat-map{
		/*height: fit-content;
		width: fit-content;*/
    margin: 50px 0;
    /*transform: translate(50%,50%);*/
    /*padding: 0px 35px;*/
    display: flex;
    flex-direction: column;
    /*padding-right: 40px;*/
}
.seat-map>div{
	height: 30px;
	display: flex;
	margin-bottom: 10px;
}
.row-num{
	/*position: absolute;*/
	/*left: 5px;*/
	/*margin-right: 30px;*/
	display: flex;
	flex-direction: column;
	/*transform: translate(50%,50%);*/
	background: white;
	box-shadow: 0 0 10px lightgray;
	z-index: 2;
	padding: 0 5px;
	text-align: center;
	/*top: 0px;*/
}
.row-num-item{
	height: 30px;
	display: block;
	line-height: 30px;
}
.row-num-item:not(:last-child){
	margin-bottom: 10px;
}
.row-text{
	/*width: 100%;*/
	background: lightgray;
	line-height: 30px;
	font-weight: bolder;
	display: inline-block;
	padding: 0 50px;
	text-align: center;
}
.show-area-info{
	margin: auto;
	transform: translateY(calc(50vh - 50%));
	text-align: center;
	background: white;
	min-width: 50%;
	padding: 10px 20px;
	max-width: 90%;
}
.area-name{
	font-size: xx-large;
}
.remaining-num{
	font-size: x-large;
}
.buy-btn{
	text-align: center;
}
.buy-btn>:not(:last-child){
	margin-right: 10px;
}
</style>