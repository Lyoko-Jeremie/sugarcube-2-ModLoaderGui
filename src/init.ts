import {Gui} from './Gui';
import {LoadingProgress} from "./LoadingProgress";


window.modLoaderGui_LoadingProgress = new LoadingProgress(window.modSC2DataManager, window.modUtils);
window.modLoaderGui = new Gui(window.modSC2DataManager, window.modUtils, window.modLoaderGui_LoadingProgress);

