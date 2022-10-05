<script setup>
import {createApp,ref,reactive,watch} from 'vue';
import scaleContainer from './scaleContainer.vue';
import TouchControl from '../../inc/touchCtrl.js';

const props=defineProps(["viewPortSize","ok"]);
const viewWidth=ref(innerWidth*0.9),viewHeight=ref(innerHeight*0.7);
const fixedStyle=reactive({left:'10px',top:'1px'});
const scale=ref(1);
watch(()=>props.viewPortSize,({viewPortSize,viewSize,defaultOffset,defaultScale})=>{
	if(!props.ok)return;
	let ele=document.querySelector('.content');
	let tc=new TouchControl({
		ele,
		containerSize:[viewWidth.value,viewHeight.value],
		viewPortSize,
		defaultOffset,
		viewSize:viewPortSize
		// viewSize:[viewWidth.value*1.5,viewHeight.value*1.5]
	},(now)=>{
		let {scaleRate,moveOffset}=now.state;
		scale.value=scaleRate;
		fixedStyle.transform=`translateX(${moveOffset[0]}px)`;
	})
	console.log(tc);
	setTimeout(()=>{
		let ele=document.querySelector('.content');
		let {left}=ele.getBoundingClientRect();
	},100);
	// let handle=setInterval(()=>{
	// 	if(scale.value>=7)clearInterval(handle);
	// 	tc.state={
	// 		...tc.state,
	// 		rotateCenter:[viewPortSize[0]/2,viewPortSize[1]/2]
	// 	}
	// 	tc.changeStateByScale(scale.value*1.1);
	// 	tc.refresh();
	// },1000);
	tc.state={
		...tc.state,
		rotateCenter:defaultOffset
	}
	tc.changeStateByScale(defaultScale);
	tc.refresh();
})

;
</script>

<template>
	<div class="container" :style="{width:viewWidth+'px',height:viewHeight+'px'}">
		<div class="content">
			<slot name="simple" :scale="scale"></slot>
			<div class="fixed" :style="fixedStyle">
				<slot name="fixed"  :scale="scale"></slot>
			</div>
		</div>
	</div>
</template>

<style scoped>
.container{
	overflow: hidden;
	transform-origin: 0 0;
}
.content{
	transform-origin: 0 0;
}
.fixed{
	transform-origin: 0 0;
	position: absolute;
}
</style>