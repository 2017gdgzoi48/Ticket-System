<script setup>
import {ref,watch,computed} from 'vue';
import {handleSeatMap} from '../../inc/util.js';

const props=defineProps(['areaList','seatMapStr']);
const emits=defineEmits(['update:seatMapStr']);

const seatMap=computed(()=>handleSeatMap(props.seatMapStr,props.areaList));
const alignStyle=computed(()=>{
	console.log(seatMap.value);
	return (seatMap.value.style=='center'?'center':(seatMap.value.style=='left'?'flex-start':'flex-end'));
})
const currentColor=ref(0);

function setColor(seat,eve){
	if(eve){
		if(eve.buttons!==1&&!eve.ctrlKey)return;
	}
	let [row,col]=seat.realPos;
	if(typeof currentColor.value!=='number'){
		let idx=Number(currentColor.value);
		seatMap.value.map[row][col].area=props.areaList[idx];
		seatMap.value.map[row][col].areaIdx=idx;
	}
	else seatMap.value.map[row][col].status=currentColor.value;
	emits('update:seatMapStr',seatMap.value.toString());
}
;
</script>

<template>
	<!-- {{Object.keys(seatMap)}} -->
	<div class="selector">
		<a-radio-group v-model:value="currentColor">
			<a-radio-button :value="1">Disable</a-radio-button>
			<a-radio-button :value="0">Seat</a-radio-button>
			<a-radio-button :value="idx+''" v-for="(area,idx) in areaList">
				{{area.areaName}}
			</a-radio-button>
		</a-radio-group>
	</div>
	<div class="container">
		<div class="seatmap-body"  :style="{alignItems:alignStyle}">
			<div v-for="row in seatMap?.map.filter(Boolean)" class="seatmap-row">
				<div v-if="row&&row.length>1" >
					<!-- {{row}} -->
					<span class="row-number">
						{{row[1].row}}
					</span>
					<div v-for="seat in row.filter(Boolean)" class="seat" :style="{marginLeft:(seat.padding*17.5-30)+'px'}">
						<!-- {{seat}} -->
						<span @click="setColor(seat)" @mousemove="eve=>setColor(seat,eve)">
							<img v-if="seat?.status==0" src="../../resource/icon/seat/seat-empty.svg">
							<img v-if="seat?.status==1" src="../../resource/icon/seat/seat-disabled.svg">
							<span class="number" :style="{color:seat.status==0?seat.area?.color||'black':'white'}">{{seat.col}}</span>
						</span>
					</div>				
				</div>
				<div v-else>
					<div class="seat-text">
						{{row[0]}}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.container{
	width: 60vw;
	overflow: scroll;
	margin: 0 auto;
}
.seatmap-body{
	height: 50vh;
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
.seat:nth-child(2){
	margin-left: 0px !important;
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
}
.row-number{
	font-weight: bolder;
	font-size: large;
	margin-right: 20px;
	display: inline-block;
	line-height: 30px;
}
</style>