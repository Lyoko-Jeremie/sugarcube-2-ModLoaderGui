import {StringTable_CN} from "./CN";
import {StringTable_EN} from "./EN";

const StringTableKeys = [
    'title',
    'close',
    'reload',
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

    'LoadLog',
    'DownloadExportData',
    'DownloadExportData2',

    'SectionMod',
    'SectionAddRemove',
    'SectionReadMe',
    'SectionLoadLog',
    'SectionDebug',

    'NoReadMeString',
] as const;

export type StringTableTypeStringPart = { [key in typeof StringTableKeys[number]]: string; };

export interface StringTableType extends StringTableTypeStringPart {
}

export function getStringTable(): StringTableType {
    switch (navigator.language) {
        case 'zh-CN':
            return StringTable_CN;
        default:
            return StringTable_EN;
    }
}
