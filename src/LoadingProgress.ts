import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {LifeTimeCircleHook} from "../../../dist-BeforeSC2/ModLoadController";
import moment from "moment";

export interface LogItem {
    time: moment.Moment;
    str: string;
}

export class LoadingProgress implements LifeTimeCircleHook {
    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.init();
    }

    initOk = false;

    init() {
        if (this.initOk) {
            console.error('init() (this.initOk)');
            return;
        }
        this.initOk = true;

        this.gSC2DataManager.getModLoadController().addLifeTimeCircleHook(this);

        this.logNode = document.createElement('div');
        this.logNode.id = 'LoadingProgressLog';
        this.logNode.innerText = '';
        this.logNode.style.cssText = 'position: fixed;left: 1px;bottom: calc(1px + 1em);' +
            'font-size: .75em;z-index: 500001;user-select: none;' +
            'border: gray dashed 2px;color: gray;padding: .25em;';
        document.body.appendChild(this.logNode);
    }

    logNode?: HTMLDivElement;

    allStart() {
        console.log('LoadingProgress allStart()');
        if (this.logNode) {
            this.logNode.style.display = 'none';
        }
    }

    logList: LogItem[] = [];

    getLoadLog() {
        return this.logList.map(T => {
            return `${T.time.format('HH:mm:ss.SSS')} ${T.str}`;
        });
    }

    update() {
        if (this.logNode) {
            this.logNode.innerText = this.getLoadLog().join('\n');
        }
    }

    InjectEarlyLoad_start(modName: string, fileName: string): void {
        this.logList.push({
            str: `InjectEarlyLoad_start [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    InjectEarlyLoad_end(modName: string, fileName: string): void {
        this.logList.push({
            str: `InjectEarlyLoad_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    EarlyLoad_start(modName: string, fileName: string): void {
        this.logList.push({
            str: `EarlyLoad_start [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    EarlyLoad_end(modName: string, fileName: string): void {
        this.logList.push({
            str: `EarlyLoad_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    Load_start(modName: string, fileName: string): void {
        this.logList.push({
            str: `Load_start [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    Load_end(modName: string, fileName: string): void {
        this.logList.push({
            str: `Load_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    PatchModToGame_start(): void {
        this.logList.push({
            str: `PatchModToGame_start`,
            time: moment(),
        });
        this.update();
    }

    PatchModToGame_end(): void {
        this.logList.push({
            str: `PatchModToGame_  end`,
            time: moment(),
        });
        this.update();
    }
}
