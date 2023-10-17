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

    NoReadMeString: '<<No ReadMe>>',

    InvalidFile: 'Invalid File',

    errorMessage2I18N(s: string): string {
        return s;
    },
};
