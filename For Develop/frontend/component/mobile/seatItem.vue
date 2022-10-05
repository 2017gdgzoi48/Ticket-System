<script setup>
const props=defineProps(["seat","status"]);
const emits=defineEmits(["changeStatus"]);
function choose(){
	let status=props.status;
	if(status!=='s'&&status!=='u')return;
	let opr={
		row:props.seat.row,
		col:props.seat.col,
		realPos:props.seat.realPos,
		price:props.seat.area.price,
		areaName:props.seat.area.areaName
	}
	if(status=='s'){
		emits('changeStatus',{
			...opr,
			kind:'choose',
			status:'c',
		});
	}else{
		emits('changeStatus',{
			...opr,
			kind:'cancelChoose',
			status:'s',
		});
	}
}

;
</script>

<template>
<span @click="choose" :style="{marginLeft:seat.padding*17.5+'px'}">
	<img v-if="status=='s'" src="../../resource/icon/seat/seat-empty.svg">
	<img v-if="status=='u'" src="../../resource/icon/seat/seat-active.svg">
	<img v-if="status=='b'||status=='d'" src="../../resource/icon/seat/seat-disabled.svg">
	<img v-if="status=='c'" src="../../resource/icon/seat/seat-choosing.svg">
	<span class="number" :style="{color:status=='s'?seat.area.color:'white'}">{{seat.col}}</span>
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