import {Gui} from './Gui';
import {LoadingProgress} from "./LoadingProgress";
import {PassageTracer} from "./PassageTracer";


window.modLoaderGui_LoadingProgress = new LoadingProgress(window.modSC2DataManager, window.modUtils);
window.modLoaderGui_PassageTracer = new PassageTracer(window);
//window.dependencyHelper 要求在所有 mod 加载完毕之后才初始化，所以不在这里进行初始化
window.modLoaderGui = new Gui(
    window.modSC2DataManager,
    window.modUtils,
    window.modLoaderGui_LoadingProgress,
    window.modLoaderGui_PassageTracer,
    window,
);

