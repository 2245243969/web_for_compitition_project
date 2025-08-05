import {
	createSSRApp
} from "vue";
import App from "./App.vue";
// 导入全局配色方案
import "./styles/global-colors.css";
// 导入网页布局样式
import "./styles/web-layout.css";

export function createApp() {
	const app = createSSRApp(App);
	
	return {
		app,
	};
}
