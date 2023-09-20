import {GM_config, Field, InitOptionsNoCustom, GM_configStruct, BootstrapBtnType} from './GM_config_TS/gm_config';
import inlineGMCss from './GM.css?inlineText';
import inlineBootstrap from 'bootstrap/dist/css/bootstrap.css?inlineText';

import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {ModBootJson} from "../../../dist-BeforeSC2/ModLoader";
import {isString, isSafeInteger, isNil} from "lodash";
import {LoadingProgress} from "./LoadingProgress";
import {PassageTracer} from "./PassageTracer";

const btnType: BootstrapBtnType = 'secondary';

const StringTable = {
    title: 'Mod管理器',
    close: '关闭',
    reload: '重新载入',
    NowLoadedModeList: '当前已加载的Mod列表：',
    NowSideLoadModeList: '当前设定的旁加载Mod列表：（下次刷新页面后生效）',
    SelectModZipFile: '选择要添加的旁加载Mod的Zip文件：',
    AddMod: '添加旁加载Mod',
    AddModResult: '添加旁加载Mod的结果：',
    CanRemoveModList: '可移除的旁加载Mod列表：',
    RemoveMod: '移除选定的旁加载Mod',

    LoadLog: '加载日志',

    SectionMod: 'Mod管理',
    SectionAddRemove: '添加/移除Mod',
    SectionLoadLog: 'Mod加载日志',
};


export class Gui {
    // avoid same Math.random
    static rIdP = 0;

    // get a unique string as id
    rId() {
        return '' + (++Gui.rIdP) + Math.random();
    }

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
        public gLoadingProgress: LoadingProgress,
        public gPassageTracer: PassageTracer,
    ) {
        this.init();
        this.gPassageTracer.addCallback((passageName) => {
            if (this.startBanner) {
                switch (passageName) {
                    case 'Start':
                        this.startBanner.style.display = 'block';
                        break;
                    default:
                        this.startBanner.style.display = 'none';
                        break;
                }
            }
        });
        this.isHttpMode = location.protocol.startsWith('http');
    }

    isHttpMode = true;

    rootNode?: HTMLDivElement;

    gui?: GM_configStruct;

    async listSideLoadMod() {
        return await this.gModUtils.getModLoadController().listModIndexDB() || [];
    }

    async createGui() {
        if (!this.rootNode) {
            this.rootNode = document.createElement('div');
            // this.rootNode.id = 'rootNodeModLoaderGui';
            this.rootNode.style.cssText = 'z-index: 1002;';
            document.body.appendChild(this.rootNode);
        }
        const NowLoadedModeList = this.getModListString().join('\n');
        const l = await this.listSideLoadMod();
        const NowSideLoadModeList: string = l.join('\n');
        console.log('NowLoadedModeList', NowLoadedModeList);
        console.log('NowSideLoadModeList', NowSideLoadModeList);
        if (this.gui && this.gui.isOpen) {
            console.log('createGui() (this.gui && this.gui.isOpen)');
            this.gui.close()
        }
        this.gui = new GM_config({
            xgmExtendInfo: {
                xgmExtendMode: 'bootstrap',
                bootstrap: {
                    smallBtn: true,
                },
                buttonConfig: {
                    noSave: true,
                    noCancel: true,
                    noReset: true,
                },
            },
            'id': 'MyConfig', // The id used for this instance of GM_config
            'title': StringTable.title, // Panel Title
            css: inlineGMCss + '\n' + (this.isHttpMode ? inlineBootstrap : ''),
            'frame': (this.isHttpMode ? undefined : this.rootNode),
            'fields': {
                'Close_b': {
                    label: StringTable.close,
                    type: 'button',
                    click: () => {
                        if (this.gui && this.gui.isOpen) {
                            this.gui.close();
                        }
                    },
                    // cssStyleText: 'display: inline-block;',
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: btnType}},
                },
                'Reload_b': {
                    label: StringTable.reload,
                    type: 'button',
                    click: () => {
                        location.reload();
                    },
                    // cssStyleText: 'display: inline-block;',
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: btnType}},
                },
                [this.rId()]: {
                    section: GM_config.create(StringTable.SectionMod),
                    type: 'br',
                },
                'NowLoadedModeList_r': {
                    label: StringTable.NowLoadedModeList,
                    type: 'textarea',
                    default: NowLoadedModeList,
                    readonly: "readonly",
                },
                'NowSideLoadModeList_r': {
                    label: StringTable.NowSideLoadModeList,
                    type: 'textarea',
                    default: NowSideLoadModeList,
                    readonly: "readonly",
                },
                [this.rId()]: {
                    section: GM_config.create(StringTable.SectionAddRemove),
                    type: 'br',
                },
                'AddMod_I': {
                    label: StringTable.SelectModZipFile,
                    type: 'file',
                    cssClassName: 'd-inline',
                },
                'AddMod_b': {
                    label: StringTable.AddMod,
                    type: 'button',
                    click: async () => {
                        this.gui!.fields['AddMod_R'].options = 'Loading...';
                        this.gui!.fields['AddMod_R'].reload();
                        const vv = this.gui!.fields['AddMod_I'].toValue();
                        if (isNil(vv)) {
                            console.error('AddMod_b (!vv) : ');
                            return;
                        }
                        console.log(vv);
                        console.log((vv as any).files);
                        // @ts-ignore
                        const doc = this.gui!.frame?.contentDocument || this.gui!.frame;
                        if (!doc) {
                            console.error('AddMod_b (!doc) : ', this.gui!.frame);
                            return;
                        }
                        try {
                            const R = await this.loadAndAddMod((vv as any));
                            // this.gui!.fields['AddMod_R'].value = `Success. reload page to take effect`;
                            this.gui!.fields['AddMod_R'].value = `Success. 刷新页面后生效`;
                            this.gui!.fields['AddMod_R'].reload();
                            // console.log('this.gModUtils.getModLoadController().listModLocalStorage()', this.gModUtils.getModLoadController().listModLocalStorage());
                            // const MyConfig_field_NowSideLoadModeList_r = doc.querySelector('#MyConfig_field_NowSideLoadModeList_r');
                            // if (MyConfig_field_NowSideLoadModeList_r) {
                            //     (MyConfig_field_NowSideLoadModeList_r as HTMLTextAreaElement).value =
                            //         this.gModUtils.getModLoadController().listModLocalStorage().join('\n');
                            // }
                        } catch (E: any) {
                            const m = E?.message || E?.toString() || E;
                            console.error('AddMod_b', E);
                            console.log(`Error: ${m}`);
                            this.gui!.fields['AddMod_R'].value = `Error: ${this.errorMessage2CN(m)}`;
                            this.gui!.fields['AddMod_R'].reload();
                        }
                        const l = await this.listSideLoadMod();
                        const MyConfig_field_RemoveMod_s = doc.querySelector('#MyConfig_field_RemoveMod_s');
                        if (MyConfig_field_RemoveMod_s) {
                            const select = (MyConfig_field_RemoveMod_s as HTMLSelectElement);
                            for (let a in select.options) {
                                select.options.remove(0);
                            }
                            for (const T of l) {
                                select.options.add(new Option(T, T));
                            }
                        }
                        const MyConfig_field_NowSideLoadModeList_r = doc.querySelector('#MyConfig_field_NowSideLoadModeList_r');
                        if (MyConfig_field_NowSideLoadModeList_r) {
                            (MyConfig_field_NowSideLoadModeList_r as HTMLTextAreaElement).value = l.join('\n');
                        }
                    },
                    // cssStyleText: 'display: inline-block;',
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: btnType}},
                },
                'AddMod_R': {
                    label: StringTable.AddModResult,
                    type: 'text',
                    value: '',
                    readonly: true,
                },
                [this.rId()]: {
                    type: 'br',
                },
                ['RemoveMod' + '_s']: {
                    label: StringTable.CanRemoveModList,
                    type: 'select',
                    labelPos: 'left',
                    options: l,
                    default: undefined,
                    cssClassName: 'd-inline',
                },
                ['RemoveMod' + '_b']: {
                    label: StringTable.RemoveMod,
                    type: 'button',
                    click: async () => {
                        // @ts-ignore
                        const doc = this.gui!.frame?.contentDocument || this.gui!.frame;
                        if (!doc) {
                            console.error('AddMod_b (!doc) : ', this.gui!.frame);
                            return;
                        }
                        const vv = this.gui!.fields['RemoveMod_s'].toValue();
                        console.log('vv', vv);
                        if (isNil(vv) || !vv || !isString(vv)) {
                            console.error('RemoveMod_b (!vv) : ', [
                                isNil(vv), !vv, !isString(vv)
                            ]);
                            return;
                        }
                        await this.gModUtils.getModLoadController().removeModIndexDB(vv);
                        const MyConfig_field_RemoveMod_s = doc.querySelector('#MyConfig_field_RemoveMod_s');

                        const l = await this.listSideLoadMod();
                        if (MyConfig_field_RemoveMod_s) {
                            const select = (MyConfig_field_RemoveMod_s as HTMLSelectElement);
                            for (let a in select.options) {
                                select.options.remove(0);
                            }
                            for (const T of l) {
                                select.options.add(new Option(T, T));
                            }
                        }
                        const MyConfig_field_NowSideLoadModeList_r = doc.querySelector('#MyConfig_field_NowSideLoadModeList_r');
                        if (MyConfig_field_NowSideLoadModeList_r) {
                            (MyConfig_field_NowSideLoadModeList_r as HTMLTextAreaElement).value = l.join('\n');
                        }
                    },
                    // cssStyleText: 'display: inline-block;',
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: btnType}},
                },
                [this.rId()]: {
                    section: GM_config.create(StringTable.SectionLoadLog),
                    type: 'br',
                },
                'LoadLog_r': {
                    label: StringTable.LoadLog,
                    type: 'textarea',
                    default: this.gLoadingProgress.getLoadLog().join('\n'),
                    readonly: "readonly",
                },
            },
            events: {
                save: (values) => {
                    // All the values that aren't saved are passed to this function
                    // for (i in values) alert(values[i]);
                },
                open: (doc) => {
                    if (this.isHttpMode) {
                        doc.addEventListener('keydown', async (event) => {
                            // console.log('keydown', event);
                            if (event.altKey && (event.key === 'M' || event.key === 'm')) {
                                if (this.gui && this.gui.isOpen) {
                                    this.gui.close();
                                } else {
                                    await this.createGui();
                                    this.gui && this.gui.open();
                                }
                            }
                        });
                    }
                },
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

        window.addEventListener('keydown', async (event) => {
            console.log('keydown', event);
            if (event.altKey && (event.key === 'M' || event.key === 'm')) {
                if (this.gui && this.gui.isOpen) {
                    this.gui.close();
                } else {
                    await this.createGui();
                    this.gui && this.gui.open();
                }
            }
        });
        if (true) {
            this.startBanner = document.createElement('div');
            this.startBanner.id = 'startBannerModLoaderGui';
            this.startBanner.innerText = StringTable.title;
            this.startBanner.style.cssText = 'position: fixed;left: 1px;bottom: calc(1px + 1em);max-width: 10em;' +
                'font-size: .75em;z-index: 1001;user-select: none;' +
                'border: gray dashed 2px;color: gray;padding: .25em;';
            this.startBanner.addEventListener('click', async () => {
                if (this.gui && this.gui.isOpen) {
                    this.gui.close();
                } else {
                    await this.createGui();
                    this.gui && this.gui.open();
                }
            });
            document.body.appendChild(this.startBanner);
        }
    }

    startBanner?: HTMLDivElement;

    async loadAndAddMod(htmlFile: HTMLInputElement) {
        try {
            const f = htmlFile.files;
            console.log('f', f);
            if (!(f && f.length === 1)) {
                console.error('loadAndAddMod() (!(f && f.length === 1))');
                return `Error: ${'loadAndAddMod() (!(f && f.length === 1))'}}`
            }
            const file = f[0];
            const data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function (e) {
                    resolve(e.target?.result);
                };
                reader.onerror = function (e) {
                    reject(e);
                }
            });
            console.log('data', data);
            if (data && isString(data) && /^data:[^:;]+;base64,/.test(data)) {
                const base64 = data.replace(/^data:[^:;]+;base64,/, '');
                const zipFile: ModBootJson | string = await this.gModUtils.getModLoadController().checkModZipFileIndexDB(base64);
                if (isString(zipFile)) {
                    return `Error: ${zipFile}}`
                } else {
                    try {
                        await this.gModUtils.getModLoadController().addModIndexDB(zipFile.name, base64);
                    } catch (e) {
                        console.error(e);
                        try {
                            this.gModUtils.getModLoadController().addModLocalStorage(zipFile.name, base64);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            }
            return `Success. reload page to take effect`;
        } catch (E: any) {
            console.error('loadAndAddMod', E);
            const m = E?.message || E?.toString() || E;
            // return `Error: ${m}}`
            return Promise.reject(E);
        }
    }

    errorMessage2CN(s: string) {
        if (s.includes('The quota has been exceeded.')) {
            return 'Zip文件过大，无法存储';
        }
        if (s.includes('Encrypted zip are not supported')) {
            return '无法解密加密的Zip文件';
        }
        if (s.includes(`Can't find end of central directory : is this a zip file ? If it is, see`)) {
            return s.replace(`Can't find end of central directory : is this a zip file ? If it is, see`,
                `无法找到Zip文件的中央目录：这是一个zip文件吗？如果是，请参阅 `);
        }
        if (s.includes(`bootJson Invalid`)) {
            return 'bootJson无效';
        }
        if (/^bootJsonFile .+ Invalid$/.test(s)) {
            return s.replace(/^bootJsonFile (.+) Invalid$/, `bootJson文件 $1 无效`);
        }
        return s;
    }

    getModListString() {
        const l = this.gModUtils.getModListName();
        const ll = this.gSC2DataManager.getModLoader().getLocalLoader();
        const rl = this.gSC2DataManager.getModLoader().getRemoteLoader();
        const lsl = this.gSC2DataManager.getModLoader().getLocalStorageLoader();
        const idl = this.gSC2DataManager.getModLoader().getIndexDBLoader();
        const r: string[] = [];
        for (const T of l) {
            let f = false;
            const mi = this.gModUtils.getMod(T);
            if (ll && ll.modZipList.has(T)) {
                r.push(`[Local] ${T} {v:${mi?.version || '?'}}`);
                f = true;
            }
            if (rl && rl.modZipList.has(T)) {
                r.push(`[Remote] ${T} {v:${mi?.version || '?'}}`);
                f = true;
            }
            if (idl && idl.modZipList.has(T)) {
                r.push(`[SideLoad IndexDB] ${T} {v:${mi?.version || '?'}}`);
                f = true;
            }
            if (lsl && lsl.modZipList.has(T)) {
                r.push(`[SideLoad LocalStorage] ${T} {v:${mi?.version || '?'}}`);
                f = true;
            }
            if (!f) {
                r.push(`[?] ${T}`);
            }
        }
        return r;
    }

}

