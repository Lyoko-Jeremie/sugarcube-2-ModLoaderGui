import {GM_config, Field, InitOptionsNoCustom, GM_configStruct, BootstrapBtnType} from './GM_config_TS/gm_config';
import inlineGMCss from './GM.css?inlineText';
import inlineBootstrap from 'bootstrap/dist/css/bootstrap.css?inlineText';

import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {ModBootJson} from "../../../dist-BeforeSC2/ModLoader";
import {isString, isSafeInteger, isNil, isArray, isEqual} from "lodash";
import moment from "moment";
import {LoadingProgress} from "./LoadingProgress";
import {PassageTracer} from "./PassageTracer";
import {DebugExport} from "./DebugExport";
import {ModZipReader} from '../../../dist-BeforeSC2/ModZipReader';
import {getStringTable} from './GUI_StringTable/StringTable';

const btnType: BootstrapBtnType = 'secondary';

let StringTable = getStringTable();

const divModCss = `
#MyConfig_wrapper {
    padding: 1em;
}
`;

export class Gui {
    // avoid same Math.random
    static rIdP = 0;

    // get a unique string as id
    rId() {
        return '' + (++Gui.rIdP) + Math.random();
    }

    debugExport: DebugExport;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
        public gLoadingProgress: LoadingProgress,
        public gPassageTracer: PassageTracer,
        public thisWin: Window,
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
        this.debugExport = new DebugExport(gSC2DataManager, gModUtils, gLoadingProgress);
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
        console.log('title', StringTable.title + (this.gModUtils.version || ''));
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
            'id': 'MyConfig',
            'title': StringTable.title + (this.gModUtils.version || ''),
            css: inlineGMCss + '\n' + (this.isHttpMode ? inlineBootstrap : divModCss),
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
                // TODO language select section
                // TODO safeMode section
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
                // TODO side load mod disable section
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
                            console.error('RemoveMod_b (!doc) : ', this.gui!.frame);
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
                    section: GM_config.create(StringTable.SectionReadMe),
                    type: 'br',
                },
                ['ReadMe' + '_s']: {
                    label: StringTable.ReadMeSelect,
                    type: 'select',
                    labelPos: 'left',
                    options: this.gModUtils.getModListName(),
                    default: undefined,
                    cssClassName: 'd-inline',
                },
                ['ReadMe' + '_b']: {
                    label: StringTable.ReadMeButton,
                    type: 'button',
                    click: async () => {
                        // @ts-ignore
                        const doc = this.gui!.frame?.contentDocument || this.gui!.frame;
                        if (!doc) {
                            console.error('ReadMe_b (!doc) : ', this.gui!.frame);
                            return;
                        }
                        const vv = this.gui!.fields['ReadMe_s'].toValue();
                        console.log('vv', vv);
                        if (isNil(vv) || !vv || !isString(vv)) {
                            console.error('ReadMe_b (!vv) : ', [
                                isNil(vv), !vv, !isString(vv)
                            ]);
                            return;
                        }
                        const readMe = await this.getModTReadMe(vv);
                        const bootJson = await this.getModTJson(vv);
                        // console.log('readMe', readMe);

                        (this.gui!.fields['ReadMe_r'].node as HTMLTextAreaElement).value = readMe;
                        (this.gui!.fields['BootJson_r'].node as HTMLTextAreaElement).value = bootJson;
                        // const MyConfig_field_ReadMe_r = doc.querySelector('#MyConfig_field_ReadMe_r');
                        // if (MyConfig_field_ReadMe_r) {
                        //     (MyConfig_field_ReadMe_r as HTMLTextAreaElement).value = readMe;
                        // }
                        // const MyConfig_field_BootJson_r = doc.querySelector('#MyConfig_field_BootJson_r');
                        // if (MyConfig_field_BootJson_r) {
                        //     (MyConfig_field_BootJson_r as HTMLTextAreaElement).value = bootJson;
                        // }
                    },
                    // cssStyleText: 'display: inline-block;',
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: btnType}},
                },
                'ReadMe_r': {
                    label: StringTable.ReadMeContent,
                    type: 'textarea',
                    default: '',
                    readonly: "readonly",
                },
                'BootJson_r': {
                    label: StringTable.ReadMeContent,
                    type: 'textarea',
                    default: '',
                    readonly: "readonly",
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
                [this.rId()]: {
                    section: GM_config.create(StringTable.SectionDebug),
                    type: 'br',
                },
                'DownloadExportData_b': {
                    label: StringTable.DownloadExportData,
                    type: 'button',
                    click: async () => {
                        this.debugExport.createDownload(
                            await this.debugExport.exportData(),
                            `DoLModExportData_${moment().format('YYYYMMDD_HHmmss')}.zip`
                        )
                    },
                    // cssStyleText: 'display: inline-block;',
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: btnType}},
                },
                'DownloadExportData2_b': {
                    label: StringTable.DownloadExportData2,
                    type: 'button',
                    click: async () => {
                        this.debugExport.createDownload(
                            await this.debugExport.exportData(true),
                            `DoLModExportData_${moment().format('YYYYMMDD_HHmmss')}.zip`
                        )
                    },
                    // cssStyleText: 'display: inline-block;',
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: btnType}},
                },
            },
            events: {
                save: (values) => {
                    // All the values that aren't saved are passed to this function
                    // for (i in values) alert(values[i]);
                },
                open: (doc) => {
                    const loadLogNode = this.gui!.fields['LoadLog_r'].node;
                    console.log('loadLogNode', loadLogNode);
                    console.log('loadLogNode', loadLogNode?.parentNode);
                    if (loadLogNode && loadLogNode.parentNode) {
                        const pn = loadLogNode?.parentNode;
                        pn.removeChild(loadLogNode);
                        const n = document.createElement('div');
                        n.style.cssText = 'font-family: "Consolas", monospace;';
                        const ll = this.gLoadingProgress.getLoadLogHtml();
                        ll.filter(T => {
                            switch (T.style.color) {
                                case 'orange':
                                    T.style.color = 'whitesmoke';
                                    T.style.backgroundColor = 'chocolate';
                                    break;
                                case 'red':
                                    T.style.color = 'whitesmoke';
                                    T.style.backgroundColor = 'firebrick';
                                    break;
                                case 'gray':
                                    T.style.color = 'mistyrose';
                                    break;
                                default:
                                    break;
                            }
                        });
                        n.append(...ll);
                        pn.appendChild(n);
                    }
                    if (this.isHttpMode) {
                        doc.addEventListener('keydown', async (event) => {
                            // console.log('keydown', event);
                            if (event.altKey && (event.key === 'M' || event.key === 'm')) {
                                if (event.shiftKey) {
                                    if (this.gui && this.gui.isOpen) {
                                        this.gui.close();
                                    }
                                    return;
                                }
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

        this.thisWin.addEventListener('keydown', async (event) => {
            console.log('keydown', event);
            if (event.altKey && (event.key === 'M' || event.key === 'm')) {
                if (event.shiftKey) {
                    if (this.gui && this.gui.isOpen) {
                        this.gui.close();
                    }
                    return;
                }
                if (this.gui && this.gui.isOpen) {
                    this.gui.close();
                } else {
                    this.gui && this.gui.close();
                    await this.createGui();
                    this.gui && this.gui.open();
                }
            }
        });

        this.thisWin.addEventListener('keydown', async (event) => {
            if (event.altKey && event.ctrlKey && (event.key === 'D' || event.key === 'd')) {
                this.debugExport.createDownload(
                    await this.debugExport.exportData(),
                    `DoLModExportData_${moment().format('YYYYMMDD_HHmmss')}.zip`
                )
            }
        });

        if (true) {
            this.startBanner = document.createElement('div');
            this.startBanner.id = 'startBannerModLoaderGui';
            this.startBanner.innerText = StringTable.title + (this.gModUtils.version || '');
            this.startBanner.style.cssText = 'position: fixed;left: 1px;bottom: calc(1px + 1em);max-width: 10em;' +
                'font-size: .75em;z-index: 1001;user-select: none;' +
                'border: gray dashed 2px;color: gray;padding: .25em;';
            this.startBanner.addEventListener('click', async () => {
                if (this.gui && this.gui.isOpen) {
                    this.gui.close();
                } else {
                    this.gui && this.gui.close();
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
                return Promise.reject(`Error: ${'loadAndAddMod() (!(f && f.length === 1))'}}`);
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
                    return Promise.reject(`Error: ${zipFile}}`);
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
        if (navigator.language !== 'zh-CN') {
            return s;
        }
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
            const rr: string[] = [];
            if (ll && ll.modZipList.has(T)) {
                rr.push(`[Local] ${T} {v:${mi?.version || '?'}}`);
                f = true;
            }
            if (rl && rl.modZipList.has(T)) {
                rr.push(`[Remote] ${T} {v:${mi?.version || '?'}}`);
                f = true;
            }
            if (idl && idl.modZipList.has(T)) {
                rr.push(`[SideLoad IndexDB] ${T} {v:${mi?.version || '?'}}`);
                f = true;
            }
            if (lsl && lsl.modZipList.has(T)) {
                rr.push(`[SideLoad LocalStorage] ${T} {v:${mi?.version || '?'}}`);
                f = true;
            }
            if (rr.length === 1) {
                r.push(...rr);
            } else {
                for (let i = 0; i < rr.length - 1; i++) {
                    r.push('[Overwritten]' + rr[i]);
                }
                r.push(rr[rr.length - 1]);
            }
            if (!f) {
                r.push(`[?] ${T}`);
            }
        }
        return r;
    }

    async getModTReadMe(name: string) {
        const mod = this.gModUtils.getMod(name);
        // console.log('getModTReadMe()', this.gSC2DataManager.getModLoader().modCache);
        // console.log('getModTReadMe()', [name, mod]);
        if (!mod) {
            console.error('getModTReadMe() (!mod)', name);
            return StringTable.NoReadMeString;
        }
        const additionFile = mod.bootJson.additionFile;
        if (!additionFile || isArray(additionFile) && additionFile.length === 0) {
            console.error('getModTReadMe() (!additionFile || isArray(additionFile) && additionFile.length === 0)', [
                name, mod, additionFile
            ]);
            return StringTable.NoReadMeString;
        }
        const readme = additionFile.find(T => T.toLowerCase().startsWith('readme'));
        if (!readme) {
            console.error('getModTReadMe() (!readme)', name);
            return StringTable.NoReadMeString;
        }
        const modZips = this.gModUtils.getModZip(name);
        if (!modZips || modZips.length === 0) {
            // never go there
            console.error('getModTReadMe() (!modZips || modZips.length === 0)', name);
            return StringTable.NoReadMeString;
        }
        const zip = modZips.find((T: ModZipReader) => isEqual(T.getModInfo()?.bootJson, mod.bootJson));
        if (!zip) {
            // never go there
            console.error('getModTReadMe() (!zip)', [name, modZips, mod]);
            return StringTable.NoReadMeString;
        }
        const readmeFile = zip.getZipFile().file(readme);
        // console.log('readmeFile', readmeFile?.async('string'));
        return await readmeFile?.async('string') || StringTable.NoReadMeString;
    }

    async getModTJson(name: string) {
        const mod = this.gModUtils.getMod(name);
        if (!mod) {
            console.error('getModTReadMe() (!mod)', name);
            return StringTable.NoReadMeString;
        }
        return JSON.stringify(mod.bootJson, undefined, 2);
    }

}

