import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {LifeTimeCircleHook} from "../../../dist-BeforeSC2/ModLoadController";
import moment from "moment";

export interface LogItem {
    time: moment.Moment;
    str: string;
    type?: 'info' | 'warning' | 'error';
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

        this.gSC2DataManager.getModLoadController().addLifeTimeCircleHook('ModLoaderGui LoadingProgress', this);

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

    getLoadLogHtml() {
        return this.logList.map(T => {
            const time = T.time.format('HH:mm:ss.SSS');
            const type = T.type;
            const str = T.str;
            const node = document.createElement('div');
            node.style.cssText = `color: ${type === 'error' ? 'red' : type === 'warning' ? 'orange' : 'gray'};`;
            node.innerText = `${time} ${str}`;
            return node;
        });
    }

    getLoadLog() {
        return this.logList.map(T => {
            return `${T.time.format('HH:mm:ss.SSS')} ${T.str}`;
        });
    }

    update() {
        if (this.logNode) {
            this.logNode.innerHTML = '';
            this.logNode.append(...this.getLoadLogHtml());
        }
    }

    async InjectEarlyLoad_start(modName: string, fileName: string) {
        this.logList.push({
            str: `InjectEarlyLoad_start [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    async InjectEarlyLoad_end(modName: string, fileName: string) {
        this.logList.push({
            str: `InjectEarlyLoad_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    async EarlyLoad_start(modName: string, fileName: string) {
        this.logList.push({
            str: `EarlyLoad_start [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    async EarlyLoad_end(modName: string, fileName: string) {
        this.logList.push({
            str: `EarlyLoad_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    async Load_start(modName: string, fileName: string) {
        this.logList.push({
            str: `Load_start [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    async Load_end(modName: string, fileName: string) {
        this.logList.push({
            str: `Load_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    async PatchModToGame_start() {
        this.logList.push({
            str: `PatchModToGame_start`,
            time: moment(),
        });
        this.update();
    }

    async PatchModToGame_end() {
        this.logList.push({
            str: `PatchModToGame_  end`,
            time: moment(),
        });
        this.update();
    }

    async ReplacePatcher_start(modName: string, fileName: string) {
        this.logList.push({
            str: `ReplacePatcher_start [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    async ReplacePatcher_end(modName: string, fileName: string) {
        this.logList.push({
            str: `ReplacePatcher_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
        this.update();
    }

    async ModLoaderLoadEnd() {
        this.logList.push({
            str: `ModLoaderLoadEnd.  Press [Alt+M] to open ModLoader GUI. Press [Ctrl+Alt+M] to dump data.`,
            time: moment(),
        });
        this.update();
    }

    logError(s: string): void {
        this.logList.push({
            str: `[[logError]] ${s}`,
            time: moment(),
            type: 'error',
        });
        this.update();
    }

    logInfo(s: string): void {
        this.logList.push({
            str: `[[logInfo]] ${s}`,
            time: moment(),
            type: 'info',
        });
        this.update();
    }

    logWarning(s: string): void {
        this.logList.push({
            str: `[[logWarning]] ${s}`,
            time: moment(),
            type: 'warning',
        });
        this.update();
    }
}
