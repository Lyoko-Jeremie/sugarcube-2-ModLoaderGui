import {StringTableType} from "./StringTable";

export const StringTable_EN: StringTableType = {
    title: 'ModLoader Manager',
    close: 'close',
    reload: 'reload page',

    EnableSafeMode: 'EnableSafeMode',
    DisableSafeMode: 'DisableSafeMode',
    SafeModeState: 'SafeModeState：',
    SafeModeEnabled: 'SafeModeEnabled, ModLoader will not load any mod in next page load.',
    SafeModeAutoEnabled: 'SafeModeAutoEnabled, Last 3 times load failed, ModLoader Auto Enable SafeMode.',
    SafeModeDisabled: 'SafeModeDisabled',

    NowLoadedModeList: 'NowLoadedModeList：',
    NowSideLoadModeList: 'NowSideLoadModeList：（Usable After Next Page Load If Enabled）',
    SelectModZipFile: 'SelectModZipFile：',
    AddMod: 'AddMod',
    AddModResult: 'AddModResult：',
    CanRemoveModList: 'CanRemoveModList：',
    RemoveMod: 'RemoveMod',

    ReadMeSelect: 'ModList：',
    ReadMeButton: 'ViewSelectedModReadMe',
    ReadMeContent: 'ReadMe',

    LoadLogRadioNoError: 'NotShowError',
    LoadLogRadioNoWarning: 'NotShowWarning',
    LoadLogRadioNoInfo: 'NotShowInfo',
    LoadLogReloadButton: 'ReloadLog',

    LoadLog: 'LoadLog',
    DownloadExportData: 'DownloadExportData (Ctrl+Alt+D)',
    DownloadExportData2: 'DownloadExportData2',

    SectionMod: 'ModManage',
    SectionSafeMode: 'SafeMode',
    SectionLanguageSelect: 'Language',
    SectionAddRemove: 'Add/Remove Mod',
    SectionModDisable: 'ModDisableList',
    SectionReadMe: 'Mod ReadMe',
    SectionLoadLog: 'Mod Load Log',
    SectionDebug: 'Debug',
    ModConfig: 'ModConfig',

    NoReadMeString: '<<No ReadMe>>',

    InvalidFile: 'Invalid File',

    // used for ModSubUiAngularJsService.ts

    MoveEnabledSelectedItemUp: 'Move Selected Enabled Mod Up',
    MoveEnabledSelectedItemDown: 'Move Selected Enabled Mod Down',
    EnableSelectedItem: 'Enable Selected Mod',
    DisableSelectedItem: 'Disable Selected Mod',
    MoveDisabledSelectedItemUp: 'Move Selected Disabled Mod Up',
    MoveDisabledSelectedItemDown: 'Move Selected Disabled Mod Down',


    errorMessage2I18N(s: string): string {
        return s;
    },
};
