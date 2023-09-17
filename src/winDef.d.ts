import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";

declare global {
    interface Window {
        modUtils: ModUtils;
        modSC2DataManager: SC2DataManager;

    }
}
