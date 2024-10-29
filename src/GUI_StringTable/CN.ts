import {ModNikeName, StringTableType} from "./StringTable";

export const StringTable_CN: StringTableType = {
    title: 'Mod管理器',
    close: '关闭',
    reload: '重新载入',

    EnableSafeMode: '启用安全模式',
    DisableSafeMode: '禁用安全模式',
    SafeModeState: '安全模式状态：',
    SafeModeEnabled: '安全模式已启用，ModLoader将在下次页面载入时不加载任何Mod。',
    SafeModeAutoEnabled: '安全模式已自动启用，ModLoader在最近3次载入时发生错误，自动启用安全模式。',
    SafeModeDisabled: '安全模式已禁用',

    NowLoadedModeList: '当前已加载的Mod列表：',
    NowSideLoadModeList: '当前设定的旁加载Mod列表：（启用后在下次刷新页面后生效）',
    SelectModZipFile: '选择要添加的旁加载Mod的Zip文件：',
    AddMod: '添加旁加载Mod',
    AddModResult: '添加旁加载Mod的结果：',
    CanRemoveModList: '可移除的旁加载Mod列表：',
    RemoveMod: '移除选定的旁加载Mod',

    ReadMeSelect: 'Mod列表：',
    ReadMeButton: '查看选定Mod的ReadMe',
    ReadMeContent: 'ReadMe',

    LoadLogRadioNoError: '不显示错误',
    LoadLogRadioNoWarning: '不显示警告',
    LoadLogRadioNoInfo: '不显示提示',
    LoadLogReloadButton: '重新载入日志',

    LoadLog: '加载日志',
    DownloadExportData: '导出当前所有数据以检查错误 (Ctrl+Alt+D)',
    DownloadExportData2: '导出当前所有数据以检查错误2',

    SectionMod: 'Mod管理',
    SectionSafeMode: '安全模式',
    SectionLanguageSelect: '语言',
    SectionAddRemove: '添加/移除Mod',
    SectionModDisable: 'Mod禁用列表',
    SectionReadMe: 'Mod ReadMe',
    SectionLoadLog: 'Mod加载日志',
    SectionDebug: '故障诊断',
    ModConfig: 'Mod Config',

    NoReadMeString: '<<没有ReadMe>>',

    InvalidFile: '文件无效',

    // used for ModSubUiAngularJsService.ts

    MoveEnabledSelectedItemUp: '上移选中的已启用Mod',
    MoveEnabledSelectedItemDown: '下移选中的已启用Mod',
    EnableSelectedItem: '启用选中的Mod',
    DisableSelectedItem: '禁用选中的Mod',
    MoveDisabledSelectedItemUp: '上移选中的已禁用Mod',
    MoveDisabledSelectedItemDown: '下移选中的已禁用Mod',
    ModEnableGuiTitle: 'Mod启用及排序管理(重新载入后生效)',


    errorMessage2I18N(s: string): string {
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
        if (/bootJsonFile .+ Invalid/.test(s)) {
            return s.replace(/bootJsonFile (.+) Invalid/, `bootJson文件 [$1] 无效`);
        }
        return s;
    },

    calcModNikeName(nn: ModNikeName): string | undefined {
        if (!nn) {
            return undefined;
        }
        if (typeof nn === 'string') {
            return nn;
        }
        if (nn.cn) {
            return nn.cn;
        }
        return undefined;
    },
};
