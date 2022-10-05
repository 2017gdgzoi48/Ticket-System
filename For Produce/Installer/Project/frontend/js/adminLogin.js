import {createApp} from 'vue';
import {Input,Divider,Button,Spin,message} from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import {MD5 as md5,enc as cryptoEnc} from 'crypto-js';
import axios from '../inc/axios.js'; 

const app=createApp({
	data:function(){
		return {
			password:''
		}
	},
	methods:{
		submit:function(){
			let password=md5(this.password).toString(cryptoEnc.Hex),fd=new FormData();
			fd.append('password',password);
			let hide=message.loading('登录中……');
			axios.post('/api/adminLogin',fd).then(res=>{
				hide()
				message.success('登录成功');
				setTimeout(()=>{
					location.assign('./adminPage.html')
				},750);
			}).catch(({code,msg})=>{
				message.error(`登录失败\ncode: ${code}\nmsg: ${msg}`);
			})
		}
	}
});


app.use(Input);
app.use(Divider);
app.use(Button);
app.use(Spin);
app.mount('#app');
