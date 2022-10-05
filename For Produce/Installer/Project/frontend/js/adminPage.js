import {createApp} from 'vue';
import {Menu,message,Table,Divider,Input,Button,Select,Empty,Card,Carousel,Steps,DatePicker,InputNumber,Upload,Drawer,Typography,Badge,Checkbox,List,Popover} from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

import userAdmin from '../component/pc/userAdmin.vue';
import ticketAdmin from '../component/pc/ticketAdmin.vue';
import ticketValidate from '../component/pc/ticketValidate.vue';
import watchActivity from '../component/pc/watchActivity.vue';
import changeAdminPassword from '../component/pc/changeAdminPassword.vue';
import activityAdmin from '../component/pc/activityAdmin.vue';
import createActivity from '../component/pc/createActivity.vue';
import editConfig from '../component/pc/editConfig.vue';

const app=createApp({
	data:function(){
		return {
			current:0
		}
	},
	methods:{
		changePage:function(data){
			this.current=Number(data.key)
		}
	}
});

app.use(Menu);
app.use(Table);
app.use(Divider);
app.use(Input)
app.use(Button);
app.use(Select);
app.use(Empty);
app.use(Card);
app.use(Carousel);
app.use(Steps);
app.use(DatePicker);
app.use(InputNumber);
app.use(Upload);
app.use(Drawer);
app.use(Typography);
app.use(Badge);
app.use(List);
app.use(Checkbox);
app.use(Popover);
app.component('user-admin',userAdmin);
app.component('ticket-admin',ticketAdmin);
app.component('ticket-validate',ticketValidate);
app.component('watch-activity',watchActivity);
app.component('change-password',changeAdminPassword);
app.component('activity-admin',activityAdmin);
app.component('create-activity',createActivity);
app.component('edit-config',editConfig);
app.mount('#app');