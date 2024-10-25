import {StringTable_CN} from "./CN";
import {StringTable_EN} from "./EN";

const StringTableKeys = [
    'title',
    'close',
    'reload',

    'EnableSafeMode',
    'DisableSafeMode',
    'SafeModeState',
    'SafeModeEnabled',
    'SafeModeAutoEnabled',
    'SafeModeDisabled',

    'NowLoadedModeList',
    'NowSideLoadModeList',
    'SelectModZipFile',
    'AddMod',
    'AddModResult',
    'CanRemoveModList',
    'RemoveMod',

    'ReadMeSelect',
    'ReadMeButton',
    'ReadMeContent',

    'LoadLogRadioNoError',
    'LoadLogRadioNoWarning',
    'LoadLogRadioNoInfo',
    'LoadLogReloadButton',

    'LoadLog',
    'DownloadExportData',
    'DownloadExportData2',

    'SectionMod',
    'SectionSafeMode',
    'SectionLanguageSelect',
    'SectionAddRemove',
    'SectionModDisable',
    'SectionReadMe',
    'SectionLoadLog',
    'SectionDebug',

    'ModConfig',

    'NoReadMeString',

    'InvalidFile',


    // used for ModSubUiAngularJsService.ts

    'MoveEnabledSelectedItemUp',
    'MoveEnabledSelectedItemDown',
    'EnableSelectedItem',
    'DisableSelectedItem',
    'MoveDisabledSelectedItemUp',
    'MoveDisabledSelectedItemDown',
    'ModEnableGuiTitle',

] as const;

export type StringTableTypeStringPart = { [key in typeof StringTableKeys[number]]: string; };

export interface StringTableType extends StringTableTypeStringPart {
    errorMessage2I18N(s: string): string;
}

export function getStringTable(): StringTableType {
    // zh, zh-CN, zh-TW
    if (navigator.language.startsWith('zh')) {
        return StringTable_CN;
    }
    switch (navigator.language) {
        case 'zh-CN':
            return StringTable_CN;
        default:
            return StringTable_EN;
    }
}
