import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {LifeTimeCircleHook} from "../../../dist-BeforeSC2/ModLoadController";
import type {ModBootJson} from "../../../dist-BeforeSC2/ModLoader";
import type JSZip from "jszip";
import type {Sc2EventTracerCallback} from "../../../dist-BeforeSC2/Sc2EventTracer";
import {isNil} from 'lodash';

class SafeMode implements Sc2EventTracerCallback {
    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.gSC2DataManager.getSc2EventTracer().addCallback(this);
        this.needIntoSafeMode();
    }

    public get safeModeAutoOn() {
        return !isNil(localStorage.getItem('ModLoadSwitch_safeModeAutoOn'));
    }

    public get safeModeForceOn() {
        return !isNil(localStorage.getItem('ModLoadSwitch_safeModeForceOn'));
    }

    private set safeModeAutoOn(on: boolean) {
        if (on) {
            localStorage.setItem('ModLoadSwitch_safeModeAutoOn', '1');
        } else {
            localStorage.removeItem('ModLoadSwitch_safeModeAutoOn');
        }
    }

    private set safeModeForceOn(on: boolean) {
        if (on) {
            localStorage.setItem('ModLoadSwitch_safeModeForceOn', '1');
        } else {
            localStorage.removeItem('ModLoadSwitch_safeModeForceOn');
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
        if (!this.safeModeAutoOn) {
            this.startBeginCount = 0;
        }
    }

    private needIntoSafeMode() {
        if (this.startBeginCount >= 3) {
            this.safeModeAutoOn = true;
        }
        ++this.startBeginCount;
    }

    public disableSafeMode() {
        this.safeModeAutoOn = false;
        this.safeModeForceOn = false;
        this.startBeginCount = 0;
    }

    public enableSafeMode() {
        this.safeModeForceOn = true;
    }

    public isSafeModeOn() {
        return this.safeModeForceOn || this.safeModeAutoOn;
    }
}

export class ModLoadSwitch implements LifeTimeCircleHook {
    private safeMode: SafeMode;

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

    public isSafeModeOn() {
        return this.safeMode.isSafeModeOn();
    }

    public isSafeModeAutoOn() {
        return this.safeMode.safeModeAutoOn;
    }

    async canLoadThisMod(bootJson: ModBootJson, zip: JSZip): Promise<boolean> {
        console.log('ModLoadSwitch.canLoadThisMod()', [bootJson.name]);
        if (this.safeMode.isSafeModeOn()) {
            console.log('ModLoadSwitch.canLoadThisMod() safeMode is on');
            return false;
        }
        // TODO  check load list
        return true;
    }

}
