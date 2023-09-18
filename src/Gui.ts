import {GM_config, Field, InitOptionsNoCustom, GM_configStruct, BootstrapBtnType} from './GM_config_TS/gm_config';
import inlineGMCss from './GM.css?inlineText';
import inlineBootstrap from 'bootstrap/dist/css/bootstrap.css?inlineText';

import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {ModLoadController, LifeTimeCircleHook} from "../../../dist-BeforeSC2/ModLoadController";
import type {ModBootJson} from "../../../dist-BeforeSC2/ModLoader";
import {isString, isSafeInteger, isNil} from "lodash";

const btnType: BootstrapBtnType = 'secondary';

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
    ) {
        this.init();
    }

    gui?: GM_configStruct;

    createGui() {
        const NowLoadedModeList = this.gModUtils.getModListName().join('\n');
        const NowSideLoadModeList = this.gModUtils.getModLoadController().listModLocalStorage().join('\n');
        console.log('NowLoadedModeList', NowLoadedModeList);
        console.log('NowSideLoadModeList', NowSideLoadModeList);
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
            'title': 'Degrees-of-Lewdity Cheats Mod', // Panel Title
            css: inlineGMCss + '\n' + inlineBootstrap,
            'fields': {
                'Close_b': {
                    label: 'Close',
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
                [this.rId()]: {
                    section: GM_config.create('Mod Section'),
                    type: 'br',
                },
                'NowLoadedModeList_r': {
                    label: 'NowLoadedModeList',
                    type: 'textarea',
                    default: NowLoadedModeList,
                    readonly: "readonly",
                },
                'NowSideLoadModeList_r': {
                    label: 'NowSideLoadModeList',
                    type: 'textarea',
                    default: NowSideLoadModeList,
                    readonly: "readonly",
                },
                [this.rId()]: {
                    section: GM_config.create('ADD REMOVE Section'),
                    type: 'br',
                },
                'AddMod_I': {
                    label: 'SelectModZipFile',
                    type: 'file',
                    cssClassName: 'd-inline',
                },
                'AddMod_b': {
                    label: 'AddMod',
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
                        const doc = this.gui!.frame?.contentDocument;
                        if (!doc) {
                            console.error('AddMod_b (!doc) : ', this.gui!.frame);
                            return;
                        }
                        try {
                            const R = await this.loadAndAddMod((vv as any));
                            // this.gui!.fields['AddMod_R'].value = `Success. reload page to take effect`;
                            this.gui!.fields['AddMod_R'].value = `Success. 刷新页面后生效`;
                            this.gui!.fields['AddMod_R'].reload();
                            console.log('this.gModUtils.getModLoadController().listModLocalStorage()', this.gModUtils.getModLoadController().listModLocalStorage());
                            const MyConfig_field_NowSideLoadModeList_r = doc.getElementById('MyConfig_field_NowSideLoadModeList_r');
                            if (MyConfig_field_NowSideLoadModeList_r) {
                                (MyConfig_field_NowSideLoadModeList_r as HTMLTextAreaElement).value = this.gModUtils.getModLoadController().listModLocalStorage().join('\n');
                            }
                        } catch (E: any) {
                            const m = E?.message || E?.toString() || E;
                            console.error('AddMod_b', E);
                            console.log(`Error: ${m}`);
                            this.gui!.fields['AddMod_R'].value = `Error: ${this.errorMessage2CN(m)}`;
                            this.gui!.fields['AddMod_R'].reload();
                        }
                        const MyConfig_field_RemoveMod_s = doc.getElementById('MyConfig_field_RemoveMod_s');
                        if (MyConfig_field_RemoveMod_s) {
                            const select = (MyConfig_field_RemoveMod_s as HTMLSelectElement);
                            for (let a in select.options) {
                                select.options.remove(0);
                            }
                            for (const T of this.gModUtils.getModLoadController().listModLocalStorage()) {
                                select.options.add(new Option(T, T));
                            }
                        }
                        const MyConfig_field_NowSideLoadModeList_r = doc.getElementById('MyConfig_field_NowSideLoadModeList_r');
                        if (MyConfig_field_NowSideLoadModeList_r) {
                            (MyConfig_field_NowSideLoadModeList_r as HTMLTextAreaElement).value = this.gModUtils.getModLoadController().listModLocalStorage().join('\n');
                        }
                    },
                    // cssStyleText: 'display: inline-block;',
                    cssClassName: 'd-inline',
                    xgmExtendField: {bootstrap: {btnType: btnType}},
                },
                'AddMod_R': {
                    label: 'AddModResult',
                    type: 'text',
                    value: '',
                    readonly: true,
                },
                [this.rId()]: {
                    type: 'br',
                },
                'RemoveMod_s': {
                    label: 'CanRemoveModList',
                    type: 'select',
                    labelPos: 'left',
                    options: this.gModUtils.getModLoadController().listModLocalStorage(),
                    default: undefined,
                    cssClassName: 'd-inline',
                },
                'RemoveMod_b': {
                    label: 'RemoveMod',
                    type: 'button',
                    click: () => {
                        const doc = this.gui!.frame?.contentDocument;
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
                        this.gModUtils.getModLoadController().removeModLocalStorage(vv);
                        const MyConfig_field_RemoveMod_s = doc.getElementById('MyConfig_field_RemoveMod_s');
                        if (MyConfig_field_RemoveMod_s) {
                            const select = (MyConfig_field_RemoveMod_s as HTMLSelectElement);
                            for (let a in select.options) {
                                select.options.remove(0);
                            }
                            for (const T of this.gModUtils.getModLoadController().listModLocalStorage()) {
                                select.options.add(new Option(T, T));
                            }
                        }
                        const MyConfig_field_NowSideLoadModeList_r = doc.getElementById('MyConfig_field_NowSideLoadModeList_r');
                        if (MyConfig_field_NowSideLoadModeList_r) {
                            (MyConfig_field_NowSideLoadModeList_r as HTMLTextAreaElement).value = this.gModUtils.getModLoadController().listModLocalStorage().join('\n');
                        }
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
                    doc.addEventListener('keydown', (event) => {
                        // console.log('keydown', event);
                        if (event.altKey && (event.key === 'M' || event.key === 'm')) {
                            if (this.gui && this.gui.isOpen) {
                                this.gui.close();
                            } else {
                                this.createGui();
                                this.gui && this.gui.open();
                            }
                        }
                    });
                },
            },
        });
    }

    init() {

        window.addEventListener('keydown', (event) => {
            console.log('keydown', event);
            if (event.altKey && (event.key === 'M' || event.key === 'm')) {
                if (this.gui && this.gui.isOpen) {
                    this.gui.close();
                } else {
                    this.createGui();
                    this.gui && this.gui.open();
                }
            }
        });
    }

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
                const zipFile: ModBootJson | string = await this.gModUtils.getModLoadController().checkModZipFile(base64);
                if (isString(zipFile)) {
                    return `Error: ${zipFile}}`
                } else {
                    this.gModUtils.getModLoadController().addModLocalStorage(zipFile.name, base64);
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

}

