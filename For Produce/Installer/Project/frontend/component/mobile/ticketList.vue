<script setup>
const props=defineProps(['list']);
const emits=defineEmits(['showDetail']);
</script>

<template>
<div v-if="list.length!==0">
	<div class="ticket-card" v-for="(ticket,idx) in list" @click="emits('showDetail',ticket)" :class="{used:ticket.used,uninited:!ticket.inited}">
		<svg class="svg-background" viewBox="0 0 634 203" preserveAspectRatio="none">
			<rect width="634" height="203" rx="35" fill="white"/>
			<rect x="496" width="138" height="203" rx="35" />
			<rect x="488" width="100" height="203"/>
		</svg>
		<div class="left">
			<span class="ticket-activity">{{ticket.activityName}}</span><br>
			<span class="ticket-content van-multi-ellipsis--l2">
				{{ticket.content.fullText}}
			</span>
		</div>
		<div class="right">
			<div class="use-status">
				<span v-if="!ticket.inited">未<br>确<br>定</span>
				<span v-else-if="!ticket.used">未<br>使<br>用</span>
				<span v-else >已<br>使<br>用</span>
			</div>	
		</div>
	</div>
</div>
<div v-else>
	<van-empty image="error" description="您还没有买过票。" />
</div>
</template>

<style scoped>
.ticket-card{
	height: 100px;
	width: 80vw;
	margin: 30px auto;
	display: flex;
	/*background: rgba(0,0,0,0);*/
	line-height: 25px !important;
}
.ticket-card:last-child{
	margin-bottom: 100px;
}
.ticket-activity,.ticket-content{
	padding-left: 30px;
	display: inline-block;
}
.ticket-activity{
	font-style: normal;
	/*font-weight: bold;*/
	font-size: 25px;
	line-height: 41px;
	letter-spacing: 0.5px;
	color: #000000;
	margin-top: 20px;
	text-overflow: ellipsis;
    white-space: pre;
    width: 80%;
    overflow: hidden;
    height: 35px;
}
.ticket-content{
	margin-top: 0px;
	color: #8a8a8e;
}
.left,.right{
	z-index: 2;
}
.left{
	width: calc((80vw / 300) * 230);
}
.right{
	width: calc((80vw / 300) * 70);
	text-align: center;
}
.use-status{
	font-size: min(8vw,20px);
	font-weight: bolder;
	width: 100%;
	text-align: center;
	padding-top: calc(50px - min(8vw,20px)*4/2);
	color: #4b78fe;
}
.used .use-status{
	color: #62C746;
}
.uninited{
	opacity: 0.5;
	/*pointer-events: none;*/
}
.svg-background{
	position: absolute;
	height: 100px;
	width: 80vw;
	/*drop-shadow: 0px 20px 40px #e6f2ff, inset 3px 3px 10px rgb(247, 248, 250);*/
	filter: drop-shadow(10px 10px 10px #edf7ff);
}
.used .svg-background{
	filter: drop-shadow(10px 10px 10px #e2fedbaa);
}
svg rect:not(:first-child){
	fill: #DEEDFF
}
.used svg rect:not(:first-child){
	fill: #cffbc3 !important;
}
</style>