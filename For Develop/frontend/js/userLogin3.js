import {createApp} from 'vue';
import {Toast} from 'vant';
import axios from '../inc/axios.js'; 

const app=createApp({
	data:function(){
		return {
			stuName:'',
			cardid:''
		}
	},
	methods:{
		submit:function(){
			var fd=new FormData();
			fd.append('stuName',this.stuName);
			fd.append('cardid',this.cardid);
			axios.post('/api/userLogin3',fd,{
				headers:{
					'content-type':'multipart/form-data'
				}
			}).then(res=>{
				var code=res.data.code;
				if(code==200){
					// loading.clear();
					Toast('登录成功');
					setTimeout(()=>{
						location.assign('./userIndex2.html')
					},500);
					return;
				}
				else{
					// loading.clear();
					Toast(`登录失败.`);
				}
			})
		}
	}
});
app.use(Toast);
app.mount('#app');