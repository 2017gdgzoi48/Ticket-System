<script setup>
import {watch} from 'vue';
const props=defineProps(["seat","status","blinkAreaid"]);
// const emits=defineEmits(["changeStatus"]);

watch(()=>props.blinkAreaid,val=>{
	if(props.seat.area.areaid!==val||val==-1)return;
	// debugger;
	let ele=document.querySelector(`.seat-${props.seat.row}-${props.seat.col}`);
	// console.log(ele);
	ele.classList.add('on');
	ele.style.background=props.seat.area.color;
	setTimeout(()=>{
		ele.style.background='';
		ele.classList.remove('on');	
	},1500);
})

// function choose(){
// 	let status=props.status;
// 	if(status!=='s'&&status!=='u')return;
// 	let opr={
// 		row:props.seat.row,
// 		col:props.seat.col,
// 		realPos:props.seat.realPos,
// 		price:props.seat.area.price,
// 		areaName:props.seat.area.areaName
// 	}
// 	if(status=='s'){
// 		emits('changeStatus',{
// 			...opr,
// 			kind:'choose',
// 			status:'c',
// 		});
// 	}else{
// 		emits('changeStatus',{
// 			...opr,
// 			kind:'cancelChoose',
// 			status:'s',
// 		});
// 	}
// }

;
</script>

<template>
<span :style="{marginLeft:seat.padding*17.5+'px'}" :class="'seat-'+seat.row+'-'+seat.col">
	<img v-if="status=='s'||status=='c'||status=='u'" src="../../resource/icon/seat/seat-empty.svg">
<!-- 	<img v-if="" src="../../resource/icon/seat/seat-active.svg"> -->
	<img v-if="status=='b'||status=='d'" src="../../resource/icon/seat/seat-disabled.svg">
	<!-- <img v-if="status=='c'" src="../../resource/icon/seat/seat-choosing.svg"> -->
	<span class="number" :style="{color:status=='s'||status=='c'||status=='u'?seat.area.color:'white'}">{{seat.col}}</span>
</span>
</template>

<style scoped>
img{
	width: 30px;
	height: 30px;
	display: inline-block;
	margin-right: 5px;
}
span{
	display: inline-block;
}
span.on{
	transition-duration: 0.5s;
	/*background-color: v-bind(seat.area.color);*/
}
.number{
	/*margin-right: -30px;*/
	position: absolute;
	width: 30px;
	height: 30px;
	line-height: 30px;
	text-align: center;
	transform: translate(-35px);
	font-weight: bold;
    font-size: 16px !important;
}
</style>