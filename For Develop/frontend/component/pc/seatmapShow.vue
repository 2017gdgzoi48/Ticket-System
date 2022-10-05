<script setup>
import {ref,watch,computed} from 'vue';
import {handleSeatMap} from '../../inc/util.js';

const props=defineProps(['areaList','seatMapStr','seatMapStatus']);

const seatMap=computed(()=>handleSeatMap(props.seatMapStr,props.areaList));
const currentSeat=ref({});
const goto=ref('');
const alignStyle=computed(()=>{
	console.log(seatMap.value);
	return (seatMap.value.style=='center'?'center':(seatMap.value.style=='left'?'flex-start':'flex-end'));
})

function showInfo(seat){
	currentSeat.value=seat;
}

function gotoRowCol(){
	let tag=goto.value;
	let ele=document.querySelector(`[data-tag*="${tag}"]`);
	if(!ele)return;
	ele.scrollIntoView();
	ele.children[0].animate([{backgroundColor:'orange'},{backgroundColor:'unset'}],{duration:2000})
}
;
</script>

<template>
	<!-- {{Object.keys(seatMap)}} -->
	<div class="show-body">
		<div class="container">
			<div class="seatmap-body"  :style="{alignItems:alignStyle}">
				<div v-for="row in seatMap?.map.filter(Boolean)" class="seatmap-row">
					<div v-if="row&&row.length>1" >
						<!-- {{row}} -->
						<span class="row-number">
							{{row[1].row}}
						</span>
						<div v-for="seat in row.filter(Boolean)" class="seat" @mouseleave="currentSeat={}">
								<span @mouseover="showInfo(seat)" :data-tag="`${seat.row},${seat.col}`" :style="{marginLeft:(seat.padding*17.5-30)+'px'}">
									<img v-if="seatMapStatus[seat.row][seat.col]=='s'" src="../../resource/icon/seat/seat-empty.svg">
									<img v-if="seatMapStatus[seat.row][seat.col]=='d'||seatMapStatus[seat.row][seat.col]=='b'" src="../../resource/icon/seat/seat-disabled.svg">
									<img v-if="seatMapStatus[seat.row][seat.col]=='c'" src="../../resource/icon/seat/seat-choosing.svg">
									<span class="number" :style="{color:seatMapStatus[seat.row][seat.col]=='s'?seat.area?.color||'black':'white'}">{{seat.col}}</span>
								</span>
						</div>	
					</div>
					<div v-else>
						<span class="row-number"></span>
						<div class="seat-text">
							{{row[0]}}
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="show-info">
			<div class="goto">
				<a-input v-model:value="goto" placeholder="row,col"></a-input>
				<a-button @click="gotoRowCol">go</a-button>
			</div>
			<div v-if="currentSeat.area">
				坐标：{{currentSeat.row}}排 {{currentSeat.col}}列<br>
				下标：{{currentSeat.realPos}}<br>
				状态：{{seatMapStatus[currentSeat.row][currentSeat.col]}}<br>
				区域：{{currentSeat.area.areaName}} - {{currentSeat.area.price}}元<br>
			</div>
			<div v-else>
				悬停到座位上以查看信息。
			</div>
		</div>
	</div>
</template>

<style scoped>
.show-body{
	display: flex;
}
.container{
	width: 60vw;
	overflow: scroll;
}
.seatmap-body{
	height: 45vh;
	margin: 10px auto;
	display: flex;
	width: max-content;
	flex-direction: column;
}
.seatmap-row{
	height: 30px;
	margin-bottom: 10px;
}
.seatmap-row>div{
	width: max-content;
	/*display: flex;*/
	/*word-break: keep-all;*/
}
.seat img{
	width: 30px;
	height: 30px;
	display: inline-block;
	margin-right: 5px;
}
.seat{
	display: inline-block;
}
.seat:nth-child(2)>span{
	margin-left: 0 !important;
}
.seat .number{
	/*margin-right: -35px;*/
	/*position: absolute;*/
	display: inline-block;
	width: 30px;
	height: 30px;
	line-height: 30px;
	text-align: center;
	transform: translateX(-35px);
}
.seat-text{
	font-weight: bolder;
	background: lightgrey;
	padding: 0 20px;
	display: inline-block;
}
.row-number{
	font-weight: bolder;
	font-size: large;
	margin-right: 20px;
	display: inline-block;
	line-height: 30px;
}
.show-info{
	width: 15vw;
	margin-left: 10px;
	border-left: 1px solid blue;
	padding-left: 10px;
}
.goto{
	width: 80%;
	margin-bottom: 10px;
}
.goto>:first-child{
	width: 50%;
	margin-right: 10px;
}
</style>