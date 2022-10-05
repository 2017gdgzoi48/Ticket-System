<script setup>
import {ref,reactive} from 'vue';
import {Toast} from 'vant';
import axios from '../../inc/axios.js'; 
import {schoolLevel} from '../../inc/util.js';

const userInfo=ref({});
const editing=ref(false);
const loading=Toast.loading({
	message: '加载中...',
	forbidClick: true,
});

function refresh(){
	axios.get('/api/getUser').then(res=>{
		userInfo.value=res.data;
		if(userInfo.value.level==-1){
			setTimeout(()=>alert('您还没有完善信息，请立即完善！'),0);
		}
		loading.clear();
	}).catch(({code,msg})=>{
		Toast(`操作失败，${code}-${msg}`);
	});
}
refresh();

const submitInfo=function(){
	let {cardid,realName,schoolType,uid}=userInfo.value;
	// console.log(cardid,realName,school,ope)
	if((cardid.match(/\d{8}/)||[])[0]!==cardid){
		Toast('学号输入有误。');
		return;
	}
	if(!cardid||!realName||!schoolType){
		Toast('没有输入完整');
		return;
	}
	var ok=confirm('提交后将不能再修改，确定继续吗？');
	if(!ok)return;
	axios.get('/api/updateUser',{
		params:{
			cardid,
			uid,
			schoolType,
			realName
		}
	}).then(res=>{
		Toast('修改成功');
		editing.value=false;
		refresh();
	}).catch(({code,msg})=>{
		Toast(`操作失败，${code}-${msg}`);
		editing.value=false;
	})
};
</script>

<template>
<div class="page-title">
	个人信息
</div>
<div class="total">
	欢迎您，{{userInfo.realName||'用户'}}，您的UID为<span>{{userInfo.uid}}</span>
</div>
<div class="user-info" v-if="!editing">
	<van-cell-group inset class="edit-group">
		<van-cell title="8位学号" :value="userInfo.cardid" />
		<van-cell title="所属校区" :value="schoolLevel[userInfo.schoolType]" />
		<van-cell title="真实姓名" :value="userInfo.realName" />
	</van-cell-group>
	<div class="action">
		<van-button color="linear-gradient(to right, #5983ff, #4372fe)" round class="edit-btn" @click=" editing=true" v-if="!userInfo.schoolType">编辑</van-button>
		<span class="disable-info" v-else>您已编辑过信息了，不可以再编辑</span>	
	</div>
</div>
<div class="edit-info" v-else>
	<span class="edit-warning">您只能编辑一次，请认真检查个人信息ヾ(^▽^*)))</span>
	<van-form>
		<van-cell-group inset>
			<van-field v-model="userInfo.cardid" label="8位学号" placeholder="现所在年级的8位学号" />
			<van-field v-model="userInfo.realName" label="真实姓名" placeholder="您的真实姓名" />
			<van-field label="所属校区">
				<template #input>
					<van-radio-group v-model="userInfo.schoolType" direction="horizontal">
						<van-radio name="A">初中部</van-radio>
						<van-radio name="B">高中部</van-radio>
<!--						<van-radio name="" disabled>未指定</van-radio>-->
					</van-radio-group>
				</template>
			</van-field>
		</van-cell-group>
	</van-form>
	<div class="action">
		<van-button color="linear-gradient(to right, #5983ff, #4372fe)" round class="edit-btn" @click="submitInfo" type="primary">保存</van-button>
	</div>
</div>
</template>

<style scoped>
.total{
	margin-top: 16px;
	margin-left: 30px;
	font-size: large;
	width: 80vw;
	letter-spacing: 0.5px;
	color: rgba(68, 61, 61, 0.89)
}
.page-title{
	padding-top: 40px;
	margin-left: 27px;
	width: 80vw;
	font-style: normal;
	font-weight: bold;
	font-size: 34px;
	line-height: 41px;
	letter-spacing: 0.374px;
	color: #000000;
}
.total span{
	line-height: 40px;
	color: #4b78fe;
	font-weight: bold;
	font-size: large;
}
.edit-btn{
	width:350px;
	display: block;
	margin-top: 5px;
	margin-right: 0;
	margin-left: 0;
	margin-bottom: auto;
}
.action{
	margin: 30px auto;
	width: fit-content;
}
.disable-info{
	color: grey;
}
.edit-warning{
	margin-left: 30px;
	margin-bottom: 20px;
	color: red;
	display: block;
	text-align: left;
}
</style>