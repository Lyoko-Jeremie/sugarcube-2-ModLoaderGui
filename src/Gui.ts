import {GM_config, Field, InitOptionsNoCustom, GM_configStruct, BootstrapBtnType} from './GM_config_TS/gm_config';
import inlineGMCss from './GM.css?inlineText';
import inlineBootstrap from 'bootstrap/dist/css/bootstrap.css?inlineText';

import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {ModLoadController, LifeTimeCircleHook} from "../../../dist-BeforeSC2/ModLoadController";
import {assign} from "lodash";

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
                'NowLoadedModeList_r22': {
                    label: '===NowLoadedModeList===',
                    type: 'textarea',
                    default: NowLoadedModeList,
                    readonly: "readonly",
                },
                'NowLoadedModeList_r': {
                    label: '===NowLoadedModeList===',
                    type: 'label',
                },
                ...this.gModUtils.getModListName().reduce((acc, T, I) => {
                    const o: InitOptionsNoCustom['fields'] = {};
                    o['NowLoadedModeList_' + I + '_l'] = {
                        label: `\t${I}: ${T}`,
                        type: 'label',
                    };
                    return assign<InitOptionsNoCustom['fields'], InitOptionsNoCustom['fields']>(acc, o);
                }, {} as InitOptionsNoCustom['fields']),
                'NowSideLoadModeList_r': {
                    label: '===NowSideLoadModeList===',
                    type: 'label',
                },
                ...this.gModUtils.getModLoadController().listModLocalStorage().reduce((acc, T, I) => {
                    const o: InitOptionsNoCustom['fields'] = {};
                    o['NowLoadedModeList_' + I + '_l'] = {
                        label: `\t${I}: ${T}`,
                        type: 'label',
                    };
                    return assign<InitOptionsNoCustom['fields'], InitOptionsNoCustom['fields']>(acc, o);
                }, {} as InitOptionsNoCustom['fields']),
                'NowSideLoadModeList_r22': {
                    label: '===NowSideLoadModeList===',
                    type: 'textarea',
                    default: NowSideLoadModeList,
                    readonly: "readonly",
                },

            },
            events: {
                save: (values) => {
                    // All the values that aren't saved are passed to this function
                    // for (i in values) alert(values[i]);
                },
                open: (doc) => {
                    doc.addEventListener('keydown', (event) => {
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
                },
            },
        });
    }

    init() {

        window.addEventListener('keydown', (event) => {
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

}

