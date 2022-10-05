import {createApp} from 'vue';
import {Result,Button} from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

const app=createApp({
	data:function(){
		
	}
});
app.use(Result);
app.use(Button);
app.mount('#app');