import {createApp} from 'vue';
import axios from '../inc/axios.js';
import {Tabbar,TabbarItem,ImagePreview,Toast,PullRefresh,Swipe,SwipeItem,Empty,Tag,Button,Icon,ActionSheet,NavBar,Divider,Cell,CellGroup,Form,Field,RadioGroup,Radio,Dialog,Checkbox} from 'vant';
import footer from '../component/mobile/footer.vue';
import activityIndex from '../component/mobile/activityIndex.vue';
import ticketIndex from '../component/mobile/ticketIndex.vue';
import userInfo from '../component/mobile/userInfo.vue';
import intro from '../component/mobile/intro.vue';

var app=createApp({
	data:function(){
		let pageIdx=Number(location.hash.slice(1))||0;
		pageIdx=Math.min(pageIdx,3);
		pageIdx=Math.max(pageIdx,0);
		return {
			pageIdx,
			showAnnounce:false,
			announce:'',
			noReadMore:false
		}
	},
	methods:{
		changePage:function(pageNum){
			this.pageIdx=pageNum;
			location.hash='#'+pageNum;
		},
		closeDialog:function(){
			let announce=this.announce,noReadMore=this.noReadMore;
			if(noReadMore)localStorage.announce=announce;
		}
	},
	mounted:function(){
		// alert('ss');
		axios.get('/api/getConfig',{params:{key:'sysName'}}).then(({data})=>{
			if(!data.value||!data.value.length)throw Error;
			document.title=data.value;
		}).catch(err=>{
			document.title='用户首页';
		})

		axios.get('/api/getConfig',{params:{key:'userAnnounce'}}).then(({data})=>{
			if(!data.value||!data.value.length)return;
			let announce=data.value;
			if(announce==localStorage.announce)return;
			this.announce=announce;
			this.showAnnounce=true;
			// console.log('ss');
		}).catch(err=>{
			
		})
	}
});

app.use(Tabbar);
app.use(TabbarItem);
app.use(Toast);
app.use(PullRefresh);
app.use(Swipe);
app.use(SwipeItem);
app.use(Empty);
app.use(Tag);
app.use(Button);
app.use(Icon);
app.use(ActionSheet);
app.use(NavBar);
app.use(Divider);
app.use(Cell);
app.use(CellGroup);
app.use(Form);
app.use(Field);
app.use(Radio);
app.use(RadioGroup);
app.use(ImagePreview);
app.use(Dialog);
app.use(Checkbox);
app.component('user-footer',footer);
app.component('m-activity-index',activityIndex);
app.component('m-ticket-index',ticketIndex);
app.component('m-user-info',userInfo);
app.component('m-intro',intro);
app.mount('#app');
