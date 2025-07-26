import {BootstrapBtnType, Field, GM_config, GM_configStruct} from './GM_config_TS/gm_config';
import inlineGMCss from './GM.css?inlineText';
import inlineBootstrap from 'bootstrap/dist/css/bootstrap.css?inlineText';

import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {ModBootJson, ModInfo} from "../../../dist-BeforeSC2/ModLoader";
import type {LogWrapper} from '../../../dist-BeforeSC2/ModLoadController';
import type {ModLoadFromSourceType} from '../../../dist-BeforeSC2/ModOrderContainer';
import {isArray, isNil, isString} from "lodash";
import {LoadingProgress} from "./LoadingProgress";
import {PassageTracer} from "./PassageTracer";
import {DebugExport} from "./DebugExport";
import {getStringTable, StringTableType} from './GUI_StringTable/StringTable';
import {ModLoadSwitch} from "./ModLoadSwitch";
import {KeyFilter} from "./KeyFilter";
import {ModSubUiAngularJsService} from "./ModSubUiAngularJsService";
import {ModManagerSubUi} from "./ModManagerSubUi";
import uint8ToBase64 from 'uint8-to-base64';

const btnType: BootstrapBtnType = 'secondary';

// const StringTable = getStringTable();
const StringTable: StringTableType = new Proxy({}, {
    get: function (obj, prop: keyof StringTableType) {
        const s = getStringTable();
        return s[prop];
    },
}) as StringTableType;

const divModCss = `
#MyConfig_wrapper {
    padding: 1em;
}
`;

const nickName = (mi: ModInfo | undefined) => {
    if (!mi || !mi.nickName) {
        return '';
    }
    const s = StringTable.calcModNickName(mi.nickName);
    if (!s) {
        return '';
    }
    return mi.nickName ? `<${s}> ` : '';
};

export class Gui {
    // avoid same Math.random
    static rIdP = 0;

    // get a unique string as id
    rId() {
        return '' + (++Gui.rIdP) + Math.random();
    }

    protected debugExport: DebugExport;

    protected modLoadSwitch: ModLoadSwitch;

    protected logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
        public gLoadingProgress: LoadingProgress,
        public gPassageTracer: PassageTracer,
        public thisWin: Window,
    ) {
        this.logger = gModUtils.getLogger();
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
            this.patchVersionString();
        });
        this.isHttpMode = location.protocol.startsWith('http');
        this.debugExport = new DebugExport(gSC2DataManager, gModUtils, gLoadingProgress);
        this.modLoadSwitch = new ModLoadSwitch(gSC2DataManager, gModUtils);
        this.modSubUiAngularJsService = new ModSubUiAngularJsService(gModUtils);
        this.modManagerSubUi = new ModManagerSubUi(this.modSubUiAngularJsService, this);
        const nn = this.gModUtils.getNowRunningModName();
        if (nn) {
            this.nowModName = nn;
            this.gModUtils.getMod(nn)!.modRef = this;
        } else {
            this.logger.error('[ModLoaderGui]: nowModName is undefined. error.');
        }
    }

    protected nowModName?: string;

    protected isHttpMode = true;

    protected rootNode?: HTMLDivElement;

    protected gui?: GM_configStruct;

    // public getStringTable() {
    //     return cloneDeep(StringTable);
    // }
    //
    // public setStringTable(stringTable: typeof StringTable) {
    //     StringTable = stringTable;
    // }

    protected logShowConfig = {
        noInfo: false, noWarning: false, noError: false,
    };

    async createGui() {
        if (!this.rootNode) {
            this.rootNode = document.createElement('div');
            // this.rootNode.id = 'rootNodeModLoaderGui';
            this.rootNode.style.cssText = 'z-index: 1002;';
            document.body.appendChild(this.rootNode);
        }
        const NowLoadedModeList = `ModLoader ${`{v:${this.gModUtils.version}}` || ''}\n`
            + this.getModListString().join('\n');
        const l = await this.listSideLoadMod2();
        const NowSideLoadModeList: string = l.join('\n');
        // const removeAbleModList = (await this.listSideLoadModInfo()).map(T => T.name);
        const removeAbleModList = await this.listSideLoadModNameCanUnload();
        console.log('NowLoadedModeList this.getModListString()', this.getModListString());
        console.log('NowLoadedModeList', NowLoadedModeList);
        console.log('NowSideLoadModeList', NowSideLoadModeList);
        if (this.gui && this.gui.isOpen) {
            console.log('createGui() (this.gui && this.gui.isOpen)');
            this.gui.close()
            this.modSubUiAngularJsService.release();
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
            'title': StringTable.title + ((' v' + this.gModUtils.version) || ''),
            css: inlineGMCss + '\n' + (this.isHttpMode ? inlineBootstrap : divModCss),
            'frame': (this.isHttpMode ? undefined : this.rootNode),
            'fields': {
                'Close_b': {
                    label: StringTable.close,
                    type: 'button',
                    click: () => {
                        if (this.gui && this.gui.isOpen) {
                            this.gui.close();
                            this.modSubUiAngularJsService.release();
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
                    section: GM_config.create(StringTable.SectionSafeMode),
                    type: 'br',
                },
                'EnableSafeMode_b': {
                    label: StringTable.EnableSafeMode,
                    type: 'button',
                    click: async () => {
                        console.log('EnableSafeMode_b');
                        // await 2 next tick
                        this.modLoadSwitch.enableSafeMode();
                        if (this.modLoadSwitch.isSafeModeOn()) {
                            this.gui!.fields['SafeModeState_R'].value = StringTable.SafeModeEnabled;
                        } else {
                            this.gui!.fields['SafeModeState_R'].value = StringTable.SafeModeDisabled;
                        }
                        this.gui!.fields['SafeModeState_R'].reload();
                    },
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: 'outline-danger'}},
                },
                'DisableSafeMode_b': {
                    label: StringTable.DisableSafeMode,
                    type: 'button',
                    click: async () => {
                        console.log('DisableSafeMode_b');
                        // await 2 next tick
                        this.modLoadSwitch.disableSafeMode();
                        if (this.modLoadSwitch.isSafeModeOn()) {
                            this.gui!.fields['SafeModeState_R'].value = StringTable.SafeModeEnabled;
                        } else {
                            this.gui!.fields['SafeModeState_R'].value = StringTable.SafeModeDisabled;
                        }
                        this.gui!.fields['SafeModeState_R'].reload();
                    },
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: 'outline-success'}},
                },
                'SafeModeState_R': {
                    label: StringTable.SafeModeState,
                    type: 'text',
                    value: '',
                    readonly: true,
                },
                // TODO language select section
                // [this.rId()]: {
                //     section: GM_config.create(StringTable.SectionLanguageSelect),
                //     type: 'br',
                // },
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
                // [this.rId()]: {
                //     section: GM_config.create(StringTable.SectionModDisable),
                //     type: 'br',
                // },
                // 'NowReadModeList_r': {
                //     label: StringTable.NowLoadedModeList,
                //     type: 'textarea',
                //     default: NowLoadedModeList,
                //     readonly: "readonly",
                // },
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
                        this.gui!.fields['AddMod_R'].value = 'Loading...';
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
                            this.gui!.fields['AddMod_R'].value = `Error: ${StringTable.errorMessage2I18N(m)}`;
                            this.gui!.fields['AddMod_R'].reload();
                        }
                        const l = await this.listSideLoadModNameCanUnload();
                        const MyConfig_field_RemoveMod_s = doc.querySelector('#MyConfig_field_RemoveMod_s');
                        if (MyConfig_field_RemoveMod_s) {
                            const select = (MyConfig_field_RemoveMod_s as HTMLSelectElement);
                            for (let a in select.options) {
                                select.options.remove(0);
                            }
                            for (const T of l) {
                                // select.options.add(new Option(`${T.name}${nickName(T.mod)}`, T.name));
                                // select.options.add(new Option(T.name, T.name));
                                select.options.add(new Option(T, T));
                            }
                        }
                        const MyConfig_field_NowSideLoadModeList_r = doc.querySelector('#MyConfig_field_NowSideLoadModeList_r');
                        if (MyConfig_field_NowSideLoadModeList_r) {
                            (MyConfig_field_NowSideLoadModeList_r as HTMLTextAreaElement).value = (await this.listSideLoadMod2()).join('\n');
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
                    options: removeAbleModList,
                    default: undefined,
                    cssClassName: 'd-inline',
                    afterToNode: async (node: HTMLElement, wrapper: HTMLElement | null, settings: Field, id: string, configId: string) => {
                        // const l = await this.listSideLoadModInfo();
                        // // @ts-ignore
                        // const doc = this.gui!.frame?.contentDocument || this.gui!.frame;
                        // if (!doc) {
                        //     console.error('RemoveMod_s (!doc) : ', this.gui!.frame);
                        //     return;
                        // }
                        // const RemoveMod_s_node = this.gui!.fields['RemoveMod_s'];
                        // RemoveMod_s_node.settings.options = (await this.listSideLoadModInfo()).map(T => T.name);
                        // console.log('RemoveMod afterToNode RemoveMod_s_node', RemoveMod_s_node);
                        // RemoveMod_s_node.reload();

                        // const MyConfig_field_RemoveMod_s = doc.querySelector('#MyConfig_field_RemoveMod_s');
                        // // console.log('RemoveMod afterToNode MyConfig_field_RemoveMod_s', MyConfig_field_RemoveMod_s);
                        // if (MyConfig_field_RemoveMod_s) {
                        //     const select = (MyConfig_field_RemoveMod_s as HTMLSelectElement);
                        //     // clean options
                        //     select.options.length = 0;
                        //     for (const T of l) {
                        //         console.log('RemoveMod afterToNode T', T);
                        //         select.options.add(new Option(`${T.name}${nickName(T.mod)}`, T.name));
                        //     }
                        // }
                    }
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

                        const l = await this.listSideLoadModNameCanUnload();
                        if (MyConfig_field_RemoveMod_s) {
                            const select = (MyConfig_field_RemoveMod_s as HTMLSelectElement);
                            for (let a in select.options) {
                                select.options.remove(0);
                            }
                            for (const T of l) {
                                console.log('T', T);
                                // select.options.add(new Option(`${T.name}${nickName(T.mod)}`, T.name));
                                // select.options.add(new Option(T.name, T.name));
                                select.options.add(new Option(T, T));
                            }
                        }
                        const MyConfig_field_NowSideLoadModeList_r = doc.querySelector('#MyConfig_field_NowSideLoadModeList_r');
                        if (MyConfig_field_NowSideLoadModeList_r) {
                            (MyConfig_field_NowSideLoadModeList_r as HTMLTextAreaElement).value = (await this.listSideLoadMod2()).join('\n');
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
                        const readMe = await this.getModTReadMe(vv).catch(E => {
                            console.error('getModTReadMe', E);
                            return '<Cannot Load>'
                        });
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
                    section: GM_config.create(StringTable.ModConfig),
                    type: 'br',
                },
                [this.rId()]: {
                    type: 'div',
                    afterToNode: (node: HTMLElement, wrapper: HTMLElement | null, settings: Field, id: string, configId: string) => {
                        console.log('modSubUiAngularJsService', this.modSubUiAngularJsService.Ref);
                        this.modSubUiAngularJsService.bootstrap(node);
                    },
                },
                [this.rId()]: {
                    section: GM_config.create(StringTable.SectionLoadLog),
                    type: 'br',
                },
                'LoadLog_error_c': {
                    label: StringTable.LoadLogRadioNoError,
                    type: 'checkbox',
                    default: this.logShowConfig.noError,
                    cssClassName: 'd-inline',
                    cssStyleText: 'margin-right: 0.5em;',
                },
                'LoadLog_warning_c': {
                    label: StringTable.LoadLogRadioNoWarning,
                    type: 'checkbox',
                    default: this.logShowConfig.noWarning,
                    cssClassName: 'd-inline',
                    cssStyleText: 'margin-right: 0.5em;',
                },
                'LoadLog_info_c': {
                    label: StringTable.LoadLogRadioNoInfo,
                    type: 'checkbox',
                    default: this.logShowConfig.noInfo,
                    cssClassName: 'd-inline',
                    cssStyleText: 'margin-right: 0.5em;',
                },
                ['LoadLog_reload_b']: {
                    label: StringTable.LoadLogReloadButton,
                    type: 'button',
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: 'secondary'}},
                    click: async () => {
                        console.warn('LoadLog_error_c', [
                            this.gui!.fields['LoadLog_error_c'].value,
                            this.gui!.fields['LoadLog_error_c'].node,
                            (this.gui!.fields['LoadLog_error_c'].node as HTMLInputElement)!.checked,
                        ]);
                        this.logShowConfig.noError = !!(this.gui!.fields['LoadLog_error_c'].node as HTMLInputElement)!.checked;
                        this.logShowConfig.noWarning = !!(this.gui!.fields['LoadLog_warning_c'].node as HTMLInputElement)!.checked;
                        this.logShowConfig.noInfo = !!(this.gui!.fields['LoadLog_info_c'].node as HTMLInputElement)!.checked;

                        // @ts-ignore
                        const doc: Document = this.gui!.frame?.contentDocument || this.gui!.frame;
                        if (!doc) {
                            console.error('LoadLog_reload_b (!doc) : ', this.gui!.frame);
                            return;
                        }
                        const nId = doc.querySelector('#idLoadLogHtml');
                        console.log('loadLogNode', nId);
                        console.log('loadLogNode', nId?.parentNode);
                        if (nId && nId.parentNode) {
                            const pn = nId?.parentNode;
                            pn.removeChild(nId);
                            pn.appendChild(this.getLoadLogHtml());
                        }
                    },
                },
                'LoadLog_r': {
                    label: StringTable.LoadLog,
                    type: 'textarea',
                    // default: this.gLoadingProgress.getLoadLog().join('\n'),
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
                            this.debugExport.calcExportName(),
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
                            this.debugExport.calcExportName(),
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
                    console.log('this.modLoadSwitch.isSafeModeOn()', this.modLoadSwitch.isSafeModeOn());
                    console.log('this.modLoadSwitch.isSafeModeAutoOn()', this.modLoadSwitch.isSafeModeAutoOn());
                    this.gui!.fields['SafeModeState_R'].value = (
                        this.modLoadSwitch.isSafeModeOn() ?
                            (this.modLoadSwitch.isSafeModeAutoOn() ? StringTable.SafeModeAutoEnabled : StringTable.SafeModeEnabled) :
                            StringTable.SafeModeDisabled
                    );
                    this.gui!.fields['SafeModeState_R'].reload();

                    const loadLogNode = this.gui!.fields['LoadLog_r'].node;
                    console.log('loadLogNode', loadLogNode);
                    console.log('loadLogNode', loadLogNode?.parentNode);
                    if (loadLogNode && loadLogNode.parentNode) {
                        const pn = loadLogNode?.parentNode;
                        pn.removeChild(loadLogNode);
                        pn.appendChild(this.getLoadLogHtml());
                    }
                    if (this.isHttpMode) {
                        doc.addEventListener('keydown', async (event) => {
                            // console.log('keydown', event);
                            if (KeyFilter.open(event)) {
                                if (event.shiftKey) {
                                    if (this.gui && this.gui.isOpen) {
                                        this.gui.close();
                                        await this.modSubUiAngularJsService.release();
                                    }
                                    return;
                                }
                                if (this.gui && this.gui.isOpen) {
                                    this.gui.close();
                                    await this.modSubUiAngularJsService.release();
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

    private getLoadLogHtml() {
        const n = document.createElement('div');
        n.style.cssText = 'font-family: "Consolas", monospace;';
        n.id = 'idLoadLogHtml';
        const ll = this.gLoadingProgress.getLoadLogHtml(this.logShowConfig);
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
        return n;
    }

    public getModSubUiAngularJsService() {
        return this.modSubUiAngularJsService;
    }

    protected modSubUiAngularJsService: ModSubUiAngularJsService;
    protected modManagerSubUi: ModManagerSubUi;

    protected initOk = false;

    protected init() {
        if (this.initOk) {
            console.error('init() (this.initOk)');
            return;
        }
        this.initOk = true;

        this.thisWin.addEventListener('keydown', async (event) => {
            // console.log('keydown', event);
            if (KeyFilter.open(event)) {
                if (event.shiftKey) {
                    if (this.gui && this.gui.isOpen) {
                        this.gui.close();
                        this.modSubUiAngularJsService.release();
                    }
                    return;
                }
                if (this.gui && this.gui.isOpen) {
                    this.gui.close();
                    this.modSubUiAngularJsService.release();
                } else {
                    this.gui && this.gui.close();
                    await this.createGui();
                    this.gui && this.gui.open();
                }
            }
        });

        this.thisWin.addEventListener('keydown', async (event) => {
            if (KeyFilter.exportData(event)) {
                this.debugExport.createDownload(
                    await this.debugExport.exportData(),
                    this.debugExport.calcExportName(),
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
                    this.modSubUiAngularJsService.release();
                } else {
                    this.gui && this.gui.close();
                    await this.createGui();
                    this.gui && this.gui.open();
                }
            });
            document.body.appendChild(this.startBanner);
        }
    }

    protected startBanner?: HTMLDivElement;

    async loadAndAddMod(htmlFile: HTMLInputElement) {
        try {
            const f = htmlFile.files;
            console.log('f', f);
            if (!(f && f.length === 1)) {
                console.error('loadAndAddMod() (!(f && f.length === 1))');
                return Promise.reject(`Error: ${StringTable.InvalidFile}`);
            }
            const file = f[0];
            const data: ArrayBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = function (e) {
                    resolve(e.target?.result as ArrayBuffer);
                };
                reader.onerror = function (e) {
                    reject(e);
                }
            });
            // console.log('data', data);
            const u8Data = new Uint8Array(data);
            const zipFile: ModBootJson | string = await this.gModUtils.getModLoadController().checkModZipFileIndexDB(u8Data);
            if (isString(zipFile)) {
                return Promise.reject(`Error: ${zipFile}`);
            } else {
                try {
                    await this.gModUtils.getModLoadController().addModIndexDB(zipFile.name, u8Data);
                } catch (e) {
                    console.error(e);
                    try {
                        const base64 = uint8ToBase64.encode(u8Data);
                        this.gModUtils.getModLoadController().addModLocalStorage(zipFile.name, base64);
                    } catch (e) {
                        console.error(e);
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

    async listSideLoadMod2() {
        const nameList = await this.gModUtils.getModLoadController().listModIndexDB() || [];
        const modList = this.gModUtils.getAllModInfoByFromType('IndexDB' as ModLoadFromSourceType);
        const idl = new Map<string, typeof modList[0]>(modList.map(T => [T.name, T]));
        const modNameVersionList = [];
        for (const T of nameList) {
            const modInfo = idl.get(T);
            if (modInfo) {
                modNameVersionList.push(`${T} {v:${modInfo.mod.version || '?'}}${nickName(modInfo.mod)}`);
            } else {
                modNameVersionList.push(`${T} {v:?}`);
            }
        }
        return modNameVersionList;
    }

    // async listSideLoadMod() {
    //     const nameList = await this.gModUtils.getModLoadController().listModIndexDB() || [];
    //     const idl = this.gSC2DataManager.getModLoader().getIndexDBLoader();
    //     const modNameVersionList = [];
    //     if (idl) {
    //         for (const T of nameList) {
    //             const mod = idl.modZipList.get(T);
    //             if (mod) {
    //                 modNameVersionList.push(`${T} {v:${mod[0].modInfo?.version || '?'}}`);
    //             } else {
    //                 modNameVersionList.push(`${T} {v:?}`);
    //             }
    //         }
    //     }
    //     return modNameVersionList;
    // }

    async listSideLoadModNameOnly() {
        return await this.gModUtils.getModLoadController().listModIndexDB() || [];
    }

    async listSideLoadModNameCanUnload() {
        const nameList = [
            ...await this.gModUtils.getModLoadController().listModIndexDB(),
            ...await this.gModUtils.getModLoadController().loadHiddenModList(),
        ];
        return nameList;
    }

    // async listSideLoadModInfo(): Promise<{ name: string, mod: ModInfo, from: ModLoadFromSourceType }[]> {
    //     const mList = [
    //         // ...this.gModUtils.getAllModInfoByFromType('LocalStorage' as ModLoadFromSourceType),
    //         ...this.gModUtils.getAllModInfoByFromType('IndexDB' as ModLoadFromSourceType),
    //         // ...this.gModUtils.getAllModInfoByFromType('SideLazy' as ModLoadFromSourceType),
    //     ];
    //     const nameList = [
    //         ...await this.gModUtils.getModLoadController().listModIndexDB(),
    //         ...await this.gModUtils.getModLoadController().loadHiddenModList(),
    //     ];
    //     const nameSet = new Set(nameList);
    //     return mList.filter(T => nameSet.has(T.name));
    // }

    async listSideLoadHiddenModNameOnly() {
        return await this.gModUtils.getModLoadController().loadHiddenModList() || [];
    }

    getModListString() {
        const l = this.gModUtils.getModListName();
        const ll = this.gSC2DataManager.getModLoader().getLocalLoader();
        const rl = this.gSC2DataManager.getModLoader().getRemoteLoader();
        const lsl = this.gSC2DataManager.getModLoader().getLocalStorageLoader();
        const idl = this.gSC2DataManager.getModLoader().getIndexDBLoader();
        const lal = this.gSC2DataManager.getModLoader().getLazyLoader();
        const r: string[] = [];
        for (const T of l) {
            let f = false;
            const mi = this.gModUtils.getMod(T);
            const rr: string[] = [];
            if (ll && ll.modZipList.has(T)) {
                rr.push(`[Local] ${T} ${nickName(mi)}{v:${ll.modZipList.get(T)?.[0].modInfo?.version || '?'}}`);
                f = true;
            }
            if (rl && rl.modZipList.has(T)) {
                rr.push(`[Remote] ${T} ${nickName(mi)}{v:${rl.modZipList.get(T)?.[0].modInfo?.version || '?'}}`);
                f = true;
            }
            if (idl && idl.modZipList.has(T)) {
                rr.push(`[SideLoad IndexDB] ${T} ${nickName(mi)}{v:${idl.modZipList.get(T)?.[0].modInfo?.version || '?'}}`);
                f = true;
            }
            if (lsl && lsl.modZipList.has(T)) {
                rr.push(`[SideLoad LocalStorage] ${T} ${nickName(mi)}{v:${lsl.modZipList.get(T)?.[0].modInfo?.version || '?'}}`);
                f = true;
            }
            if (lal && lal.modZipList.has(T)) {
                rr.push(`[SideLoadLazy] ${T} ${nickName(mi)}{v:${lal.modZipList.get(T)?.[0].modInfo?.version || '?'}}`);
                f = true;
            }
            if (rr.length === 0) {
                const m = this.gModUtils.getModAndFromInfo(T);
                if (m) {
                    r.push(`[alias][${m.from}] ${T} [${m.name}] ${nickName(mi)}{v:${m.mod.bootJson.version || '?'}}`);
                } else {
                    r.push(`[?] [${T}] ${nickName(mi)}{v:?}`);
                }
                f = true;
            } else if (rr.length === 1) {
                r.push(...rr);
            } else {
                for (let i = 0; i < rr.length - 1; i++) {
                    r.push(rr[i] + ' [  Overwritten  ]');
                }
                r.push(rr[rr.length - 1]);
            }
            if (!f) {
                r.push(`[?] ${T} <${nickName(mi)}>`);
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
            this.logger.error(`getModTReadMe() (!zip) [${name}]`);
            return StringTable.NoReadMeString;
        }
        const zip = this.gModUtils.getModZip(name);
        if (!zip) {
            // never go there
            console.error('getModTReadMe() (!zip)', [name, mod]);
            this.logger.error(`getModTReadMe() (!zip) [${name}]`);
            return StringTable.NoReadMeString;
        }
        const readmeFile = zip.zip.file(readme);
        // console.log('readmeFile', readmeFile?.async('string'));
        return await readmeFile?.async('string') || StringTable.NoReadMeString;
    }

    async getModTJson(name: string) {
        const mod = this.gModUtils.getMod(name);
        if (!mod) {
            console.error('getModTJson() (!mod)', name);
            this.logger.error(`getModTJson() (!zip) [${name}]`);
            return StringTable.NoReadMeString;
        }
        return JSON.stringify(mod.bootJson, undefined, 2);
    }

    patchHtmlNodeVersionString(gameVersionDisplayNode: HTMLElement | Element | undefined | null) {
        if (!gameVersionDisplayNode) {
            return;
        }
        gameVersionDisplayNode.innerHTML = `${gameVersionDisplayNode.innerHTML}-(ML${('-v' + this.gModUtils.version || '')})`;
        const clickCb = async (ev: MouseEvent | any) => {
            console.log(ev);
            if (this.gui && this.gui.isOpen) {
                this.gui.close();
                this.modSubUiAngularJsService.release();
            } else {
                await this.createGui();
                this.gui && this.gui.open();
            }
        };
        if ('onclick' in gameVersionDisplayNode) {
            gameVersionDisplayNode.onclick = clickCb;
        } else if ('addEventListener' in gameVersionDisplayNode) {
            gameVersionDisplayNode.addEventListener('click', async (ev) => {
                await clickCb(ev);
            });
        } else {
            console.warn('patchHtmlNodeVersionString() (!gameVersionDisplayNode) cannot attach clickCb.');
        }
    }

    patchVersionString() {
        // console.log('patchVersionString()');
        // StartConfig.version = `${StartConfig.version}-(ML${('-v' + this.gModUtils.version || '')})`;
        // @ts-ignore
        // StartConfig.versionName = `${StartConfig.versionName}-(ML${('-v' + this.gModUtils.version || '')})`;

        const gameVersionDisplayNodeList = [
            // for DoL
            document.getElementById('gameVersionDisplay'),
            // for Cot
            document.querySelector('div#title-container span.version'),
        ];
        for (const n of gameVersionDisplayNodeList) {
            this.patchHtmlNodeVersionString(n);
        }
    }

}

