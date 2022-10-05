import {createApp} from 'vue';
import {Toast} from 'vant';
import axios from '../inc/axios.js'; 

const app=createApp({});
app.use(Toast);
app.mount('#app');

let loading=Toast.loading({
	message: '登录中...',
	forbidClick: true,
});

let openid=location.search.slice(8),fd=new FormData();
fd.append('openid',openid);
axios.post('/api/userLogin',fd).then(res=>{
	loading.clear();
	if(res.data.realName){
		Toast('欢迎回来，'+res.data.realName);
		setTimeout(()=>{
			location.assign('./userIndex.html')
		},1000);
	}else{
		Toast('登录成功');
		setTimeout(()=>{
			location.assign('./userIndex.html#2')
		},1000)
	}
	return;
}).catch(({code,msg})=>{
	loading.clear();
	Toast(`登录失败，请联系管理员\ncode: ${code}\nmsg: ${msg}`);
})