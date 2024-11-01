import type {
    ModSubUiAngularJsModeExportInterface
} from "../../ModSubUiAngularJs/dist-ts/ModSubUiAngularJsModeExportInterface";
import {ModSubUiAngularJsService} from "./ModSubUiAngularJsService";
import {getStringTable, StringTableType} from "./GUI_StringTable/StringTable";
import {Gui} from "./Gui";


const StringTable: StringTableType = new Proxy({}, {
    get: function (obj, prop: keyof StringTableType) {
        const s = getStringTable();
        return s[prop];
    },
}) as StringTableType;


export class ModManagerSubUi {

    constructor(
        public modSubUiAngularJsService: ModSubUiAngularJsService,
        public modLoaderGui: Gui,
    ) {
        this.modSubUiAngularJsService.addLifeTimeCallback('ModManagerSubUi', {
            whenCreate: this.whenCreate.bind(this),
        });
    }

    async whenCreate(Ref: ModSubUiAngularJsModeExportInterface) {
        // const modListEnabled = await this.modLoaderGui.listSideLoadMod();
        const modListEnabled = await this.modLoaderGui.listSideLoadModNameOnly();
        const modListDisable = await this.modLoaderGui.listSideLoadHiddenModNameOnly();
        // console.log('[ModManagerSubUi] whenCreate', [modListEnabled, modListDisable]);
        Ref.addComponentModGuiConfig({
            selector: 'enable-order-component',
            data: {
                listEnabled: modListEnabled.map(T => {
                    return {
                        key: T,
                        str: T,
                        selected: false,
                    };
                }),
                listDisabled: modListDisable.map(T => {
                    return {
                        key: T,
                        str: T,
                        selected: false,
                    };
                }),
                onChange: async (
                    action: any,
                    listEnabled: {
                        key: string | number,
                        str: string,
                        selected: boolean,
                    }[],
                    listDisabled: {
                        key: string | number,
                        str: string,
                        selected: boolean,
                    }[],
                    selectedKeyEnabled: string | number,
                    selectedKeyDisabled: string | number,
                ) => {
                    try {
                        // console.log('onChange', [action, listEnabled, listDisabled, selectedKeyEnabled, selectedKeyDisabled]);
                        await this.modLoaderGui.gModUtils.getModLoadController().overwriteModIndexDBModList(listEnabled.map(T => T.key) as string[]);
                        await this.modLoaderGui.gModUtils.getModLoadController().overwriteModIndexDBHiddenModList(listDisabled.map(T => T.key) as string[]);
                    } catch (e) {
                        console.error('[ModLoaderGui] ModManagerSubUi onChange', e);
                    }
                },
                noHrSplit: true,
                buttonClass: 'btn btn-sm btn-secondary',
                text: {
                    MoveEnabledSelectedItemUp: StringTable.MoveEnabledSelectedItemUp,
                    MoveEnabledSelectedItemDown: StringTable.MoveEnabledSelectedItemDown,
                    EnableSelectedItem: StringTable.EnableSelectedItem,
                    DisableSelectedItem: StringTable.DisableSelectedItem,
                    MoveDisabledSelectedItemUp: StringTable.MoveDisabledSelectedItemUp,
                    MoveDisabledSelectedItemDown: StringTable.MoveDisabledSelectedItemDown,
                    title: StringTable.ModEnableGuiTitle,
                },
            },
        });
    }

}

