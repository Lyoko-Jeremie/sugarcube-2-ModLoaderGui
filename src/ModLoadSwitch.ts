import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {LifeTimeCircleHook} from "../../../dist-BeforeSC2/ModLoadController";
import type {ModBootJson} from "../../../dist-BeforeSC2/ModLoader";
import type JSZip from "jszip";
import {Sc2EventTracerCallback} from "../../../dist-BeforeSC2/Sc2EventTracer";


class SafeMode implements Sc2EventTracerCallback {
    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.gSC2DataManager.getSc2EventTracer().addCallback(this);
        this.needIntoSafeMode();
    }

    private get safeModeOn() {
        return !!localStorage.getItem('ModLoadSwitch_safeModeOn');
    }

    private set safeModeOn(on: boolean) {
        if (on) {
            localStorage.setItem('ModLoadSwitch_safeModeOn', '1');
        } else {
            localStorage.removeItem('ModLoadSwitch_safeModeOn');
        }
    }

    private get startBeginCount() {
        const n = localStorage.getItem('ModLoadSwitch_startBeginCount');
        return +(n ?? 0);
    }

    private set startBeginCount(n: number) {
        localStorage.setItem('ModLoadSwitch_startBeginCount', `${n}`);
    }

    whenSC2StoryReady() {
        if (!this.safeModeOn) {
            this.startBeginCount = 0;
        }
    }

    private needIntoSafeMode() {
        if (this.startBeginCount >= 3) {
            this.safeModeOn = true;
        }
        ++this.startBeginCount;
    }

    public disableSafeMode() {
        this.safeModeOn = false;
        this.startBeginCount = 0;
    }

    public enableSafeMode() {
        this.safeModeOn = true;
    }

    public isSafeModeOn() {
        return this.safeModeOn;
    }
}

export class ModLoadSwitch implements LifeTimeCircleHook {
    safeMode: SafeMode;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.gSC2DataManager.getModLoadController().addLifeTimeCircleHook('ModLoaderGui ModLoadSwitch', this);
        this.safeMode = new SafeMode(gSC2DataManager, gModUtils);
    }

    disableSafeMode() {
        this.safeMode.disableSafeMode();
    }

    enableSafeMode() {
        this.safeMode.enableSafeMode();
    }

    async canLoadThisMod(bootJson: ModBootJson, zip: JSZip): Promise<boolean> {
        if (this.safeMode.isSafeModeOn()) {
            return false;
        }
        // TODO  check load list
        return true;
    }

}
