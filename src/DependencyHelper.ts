
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {ModBootJson, ModBootJsonAddonPlugin} from "../../../dist-BeforeSC2/ModLoader";
import type {LogWrapper} from '../../../dist-BeforeSC2/ModLoadController';
import type {ModOrderItem} from '../../../dist-BeforeSC2/ModOrderContainer';
import {checkAddrArray, downloadDir} from "./DependencyDownloadAddonParams";



export class DependencyHelper
{
    logger: LogWrapper;

    downloadAddressMap: Map<string, downloadDir[]>;
    installedModMap: Map<string, ModBootJson>;
    isInProgress: boolean;
    unresolvedMods: string[];
    downloadedMods: string[];
    installedMods: string[];


    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils
    ) {
        this.logger = gModUtils.getLogger();
        this.downloadAddressMap = new Map();
        this.installedModMap = new Map();
        this.isInProgress = false;
        //下面的变量是成员变量的理由是，这些内容会在递归时进行更新。
        this.unresolvedMods = [];
        this.downloadedMods = [];
        this.installedMods = [];


        this.InitDownloadAddressMap(gSC2DataManager.getModLoader().getModCacheArray());
    }


    /**
     * 加载新的Mod，这个接口主要是用于注册已存在的Mod，不会进行依赖的分析
     * @param bootJson 待加载的 mod 的 bootJson
     * @constructor
     */
    public AddMod(bootJson: ModBootJson): boolean {
        let downloadDirList: downloadDir[] = [];
        const pp = bootJson.addonPlugin?.find((T: ModBootJsonAddonPlugin) => {
            return T.addonName === 'DependenceDownloadAddon';
        })?.params;
        if(pp !== undefined) {
            if (!checkAddrArray(pp)) {
                console.error('[DependencyHelper] AddMod() ParamsInvalid', [bootJson.name, pp]);
                this.logger.error(`[DependencyHelper] AddMod() ParamsInvalid: addon[${bootJson.name}]`);
                return false;
            }
            downloadDirList = pp;
        }
        this.downloadAddressMap.set(bootJson.name, downloadDirList);
        this.installedModMap.set(bootJson.name, bootJson);
        return true;
    }

    /**
     * 从Dependency信息中移除指定的 Mod，这个操作并不会将其依赖也一并删除。同理，当某个 Mod 依赖它的场合，也不会把那个 Mod 删除。
     * @param modName 待删除的 Mod 名
     * @constructor
     */
    public RemoveMod(modName: string) {
        if (!this.downloadAddressMap.has(modName)) {
            console.error('[DependencyHelper] RemoveMod() ModNotExists', modName);
            this.logger.error(`[DependencyHelper] RemoveMod() ModNotExists: ${modName}`);
            return false;
        }

        this.downloadAddressMap.delete(modName);
        this.installedModMap.delete(modName);

        return true;
    }


    /**
     * 检查特定 mod 的依赖情况（非semver）
     * @param modJson 待检查的 mod
     * @returns 没有满足的依赖 Mod 列表
     */
    checkDependency(modJson: ModBootJson): string[]{
        let currentUnresolvedMods: string[] = [];
        if (modJson.dependenceInfo) {
            for (const dep of modJson.dependenceInfo) {
                if (!this.installedModMap.has(dep.modName))
                {
                    if(dep.modName === "ModLoader") continue;
                    currentUnresolvedMods.push(dep.modName);
                }
            }
        }
        return currentUnresolvedMods;
    }

    /**
     * 增加某个Mod，并试图处理其依赖项
     * 即便有依赖项尚未被处理，这个 Mod 依然会被加入进去。
     * @param {ModBootJson} modJson - 要增加的 Mod
     * @param {function} downloadModCallback - 一个异步回调，用于下载、安装特定的 Mod 并再次调用这个函数。
     *
     * @returns {Promise<string[]>} - 返回没有被成功处理的依赖项
     */
    public async AddModAndResolveDependency(modJson: ModBootJson,
                                            downloadModCallback: (param: string) => Promise<void>) : Promise<{ installed: string[], unresolved: string[] }>{
        let isOuterCaller: boolean = false;
        if (!this.isInProgress)
        {
            //这个方法预计应当是在一个非并行的环境下进行运行的。
            //考虑到安装Mod可能会引入新的依赖，于是这里使用一个总的列表，来表示整个过程中没有解决的依赖。
            this.isInProgress = true;
            this.unresolvedMods.length = 0;
            this.downloadedMods.length = 0;
            this.installedMods.length = 0;
            isOuterCaller = true;
        }
        this.AddMod(modJson);

        const currentUnresolvedMods = this.checkDependency(modJson);
        if (currentUnresolvedMods.length > 0) {
            for (const modName of currentUnresolvedMods) {
                let downloadDir: string = "";
                try {
                    //此处允许失败
                    let found: boolean = false;
                    for (const value of this.downloadAddressMap.values()) {
                        for(const item of value)
                        {
                            if (item.modName === modName)
                            {
                                found = true;
                                downloadDir = item.downloadDir;
                            }
                        }
                        if (found)
                            break;
                    }
                    if (found) {//这个callback 只要不产生异常，就认为是成功的
                        await downloadModCallback(downloadDir);
                        this.installedMods.push(modName);
                    }
                } catch (error) {
                    console.error('[DependencyHelper] AddModAndResolveDependency() Failed to download mod:', [error, downloadDir]);
                }
            }
        }
        //在安装完成后重新检查依赖，如果没有未解决的依赖，则视为安装完毕。
        const resolveFailMods = this.checkDependency(modJson);
        if (resolveFailMods.length > 0)
        {
            for (const element of resolveFailMods)
            {
                if (!this.unresolvedMods.includes(element)) {
                    this.unresolvedMods.push(element);
                }
            }
        }
        if (isOuterCaller)
        {
            this.isInProgress = false;
        }
        else
        {
            this.downloadedMods.push(modJson.name);
        }
        //进行一个深复制，避免外部修改这些内部状态
        return {unresolved:this.unresolvedMods.slice(), installed: this.installedMods.slice()};
    }

    InitDownloadAddressMap(arr: ModOrderItem[]) {
        for (let item of arr) {
            let json = item.mod.bootJson;
            this.AddMod(json);
        }
    }
}
