import {Gui} from './Gui';
import {LoadingProgress} from "./LoadingProgress";
import {PassageTracer} from "./PassageTracer";


window.modLoaderGui_LoadingProgress = new LoadingProgress(window.modSC2DataManager, window.modUtils);
window.modLoaderGui_PassageTracer = new PassageTracer(window);
window.modLoaderGui = new Gui(
    window.modSC2DataManager,
    window.modUtils,
    window.modLoaderGui_LoadingProgress,
    window.modLoaderGui_PassageTracer,
    window,
);
window.modLoaderGui_ModSubUiAngularJsService = window.modLoaderGui.getModSubUiAngularJsService();

