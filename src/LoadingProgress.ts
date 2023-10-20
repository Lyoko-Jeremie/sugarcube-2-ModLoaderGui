import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {LifeTimeCircleHook} from "../../../dist-BeforeSC2/ModLoadController";
import moment from "moment";
import {Subject} from 'rxjs';
import {bufferTime, map} from 'rxjs/operators';

export interface LogItem {
    time: moment.Moment;
    str: string;
    type?: 'info' | 'warning' | 'error';
}

export class LogShowConfig {
    noInfo: boolean = false;
    noWarning: boolean = false;
    noError: boolean = false;
}

export class LoadingProgress implements LifeTimeCircleHook {
    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.init();
        this.logSubject.pipe(
            map(T => {
                this.logList.push(T);
                return this.LogItem2Node(T);
            }),
            bufferTime(100),
        ).subscribe({
            next: (T) => {
                // if (this.logNode) {
                //     this.logNode.append(...T);
                // }
                if (this.logNode) {
                    this.logNode.innerHTML = '';
                    this.logNode.append(...this.getLoadLogHtml());
                }
            },
            error: (e) => {
                console.error('LoadingProgress logSubject error', e);
            },
            complete: () => {
            },
        });
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
        this.logNode.style.cssText = 'position: fixed;left: 1px;bottom: calc(1px + 3em);' +
            'font-size: .75em;z-index: 500001;user-select: none;' +
            'border: gray dashed 2px;color: gray;padding: .25em;' +
            'pointer-events: none;';
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

    logSubject = new Subject<LogItem>();

    LogItem2Node(T: LogItem, noTime: boolean = false) {
        const time = T.time.format('HH:mm:ss.SSS');
        const type = T.type;
        const str = T.str;
        const node = document.createElement('div');
        node.style.cssText = `color: ${type === 'error' ? 'red' : type === 'warning' ? 'orange' : 'gray'};`;
        if (noTime) {
            node.innerText = str;
            return node;
        } else {
            node.innerText = `${time} ${str}`;
            return node;
        }
    }

    getLoadLogHtml(logShowConfig: LogShowConfig = new LogShowConfig()) {
        const nnn = this.logList.reduce((a, T) => {
            switch (T.type) {
                case 'error':
                    ++a[0];
                    break;
                case 'warning':
                    ++a[1];
                    break;
                case 'info':
                    ++a[2];
                    break;
            }
            return a;
        }, [0, 0, 0]);
        const notice: LogItem = {
            str: `【 ${nnn[0]} error, ${nnn[1]} warning, ${nnn[2]} info 】`,
            time: moment(),
        };
        if (nnn[0] > 0) {
            notice.type = 'error';
        } else if (nnn[1] > 0) {
            notice.type = 'warning';
        } else {
            notice.type = 'info';
        }
        return [this.LogItem2Node(notice, true)].concat(
            this.logList.filter(T => {
                return !((logShowConfig.noInfo && T.type === 'info')
                    || (logShowConfig.noWarning && T.type === 'warning')
                    || (logShowConfig.noError && T.type === 'error'));
            }).map((T, i) => {
                return this.LogItem2Node(T);
            }),
        );
    }

    getLoadLog() {
        return this.logList.map(T => {
            return `${T.time.format('HH:mm:ss.SSS')} ${T.str}`;
        });
    }

    // update() {
    //     if (this.logNode) {
    //         this.logNode.innerHTML = '';
    //         this.logNode.append(...this.getLoadLogHtml());
    //     }
    // }

    async InjectEarlyLoad_start(modName: string, fileName: string) {
        this.logSubject.next({
            str: `InjectEarlyLoad_start [${modName}] [${fileName}]`,
            time: moment(),
        });
    }

    async InjectEarlyLoad_end(modName: string, fileName: string) {
        this.logSubject.next({
            str: `InjectEarlyLoad_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
    }

    async EarlyLoad_start(modName: string, fileName: string) {
        this.logSubject.next({
            str: `EarlyLoad_start [${modName}] [${fileName}]`,
            time: moment(),
        });
    }

    async EarlyLoad_end(modName: string, fileName: string) {
        this.logSubject.next({
            str: `EarlyLoad_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
    }

    async Load_start(modName: string, fileName: string) {
        this.logSubject.next({
            str: `Load_start [${modName}] [${fileName}]`,
            time: moment(),
        });
    }

    async Load_end(modName: string, fileName: string) {
        this.logSubject.next({
            str: `Load_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
    }

    async PatchModToGame_start() {
        this.logSubject.next({
            str: `PatchModToGame_start`,
            time: moment(),
        });
    }

    async PatchModToGame_end() {
        this.logSubject.next({
            str: `PatchModToGame_  end`,
            time: moment(),
        });
    }

    async ReplacePatcher_start(modName: string, fileName: string) {
        this.logSubject.next({
            str: `ReplacePatcher_start [${modName}] [${fileName}]`,
            time: moment(),
        });
    }

    async ReplacePatcher_end(modName: string, fileName: string) {
        this.logSubject.next({
            str: `ReplacePatcher_  end [${modName}] [${fileName}]`,
            time: moment(),
        });
    }

    async ModLoaderLoadEnd() {
        this.logSubject.next({
            str: `ModLoaderLoadEnd.  Press [Alt+M] to open ModLoader GUI. Press [Ctrl+Alt+D] to dump data.`,
            time: moment(),
        });
    }

    logError(s: string): void {
        this.logSubject.next({
            str: `[[logError]] ${s}`,
            time: moment(),
            type: 'error',
        });
    }

    logInfo(s: string): void {
        this.logSubject.next({
            str: `[[logInfo]] ${s}`,
            time: moment(),
            type: 'info',
        });
    }

    logWarning(s: string): void {
        this.logSubject.next({
            str: `[[logWarning]] ${s}`,
            time: moment(),
            type: 'warning',
        });
    }
}
