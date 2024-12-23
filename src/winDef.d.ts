import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type jQuery from "jquery/misc";

declare global {
    interface Window {
        modUtils: ModUtils;
        modSC2DataManager: SC2DataManager;

        modLoaderGui: Gui;
        modLoaderGui_ModSubUiAngularJsService: ModSubUiAngularJsService;
        modLoaderGui_LoadingProgress: LoadingProgress;
        modLoaderGui_PassageTracer: PassageTracer;

        jQuery: jQuery;
    }

    var StartConfig: any;
    var SugarCube: {
        Macro: {
            get: (name: string) => any;
        };
        Story: {
            title: string;
        };
    };

}
