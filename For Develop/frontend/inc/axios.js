import axios from 'axios';
import {httpPort} from './config.js';

const instance=axios.create();
instance.defaults.withCredentials = true;
instance.defaults.baseURL='http://'+location.hostname+':'+httpPort+'/'; 
instance.defaults.headers.post['Content-Type']='multipart/form-data';
instance.interceptors.response.use(response=>{
	let {code,data,msg}=response.data;
	if(code>=300)return Promise.reject({code,msg});
	else{
		response.data=data;
		response.serverCode=code;
		response.serverMsg=msg;
		return response;
	}
},err=>Promise.reject({code:null,msg:err}));

export default instance;