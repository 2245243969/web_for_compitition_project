import {
	createSSRApp
} from "vue";
import App from "./App.vue";
// 导入全局配色方案
import "./styles/global-colors.css";
// 导入网页布局样式
import "./styles/web-layout.css";
// 导入错误处理工具
import { setupGlobalErrorHandler } from "./utils/errorHandler.js";

export function createApp() {
	const app = createSSRApp(App);

	// 设置全局错误处理
	setupGlobalErrorHandler(app);

	return {
		app,
	};
}
