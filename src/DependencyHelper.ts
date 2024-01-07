
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {ModBootJson, ModBootJsonAddonPlugin} from "../../../dist-BeforeSC2/ModLoader";
import type {LogWrapper} from '../../../dist-BeforeSC2/ModLoadController';
import type {ModOrderItem} from '../../../dist-BeforeSC2/ModOrderContainer';
import {checkAddrObject, downloadDir} from "./DependencyDownloadAddonParams";



export class DependencyHelper
{
    logger: LogWrapper;

    downloadAddressMap: Map<string, downloadDir[]>;
    installedModMap: Map<string, ModBootJson>;
    isInProgress: boolean;
    unresolvedMods: string[];
    downloadedMods: string[];


    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils
    ) {
        this.logger = gModUtils.getLogger();
        this.downloadAddressMap = new Map();
        this.installedModMap = new Map();
        this.isInProgress = false;
        this.unresolvedMods = [];
        this.downloadedMods = [];

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
        if (!checkAddrObject(pp)) {
            console.error('[DependencyHelper] AddMod() ParamsInvalid', [bootJson.name, pp]);
            this.logger.error(`[DependencyHelper] AddMod() ParamsInvalid: addon[${bootJson.name}]`);
            return false;
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
        let unresolvedMods: string[] = [];
        if (modJson.dependenceInfo) {
            for (const dep of modJson.dependenceInfo) {
                if (!this.installedModMap.has(dep.modName))
                {
                    unresolvedMods.push(dep.modName);
                }
            }
        }
        return unresolvedMods;
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
                                            downloadModCallback: (param: string) => Promise<void>) : Promise<string[]>{
        let isOuterCaller: boolean = false;
        if (!this.isInProgress)
        {
            //这个方法预计应当是在一个非并行的环境下进行运行的。
            //考虑到安装Mod可能会引入新的依赖，于是这里使用一个总的列表，来表示整个过程中没有解决的依赖。
            this.isInProgress = true;
            this.unresolvedMods.length = 0;
            this.downloadedMods.length = 0;
            isOuterCaller = true;
        }
        this.AddMod(modJson);

        const unresolvedMods = this.checkDependency(modJson);
        if (unresolvedMods.length > 0) {
            for (const modName of unresolvedMods) {
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
                    if (found) {
                        await downloadModCallback(downloadDir);
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
                unresolvedMods.push(element);
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
        return unresolvedMods;
    }

    InitDownloadAddressMap(arr: ModOrderItem[]) {
        for (let item of arr) {
            let json = item.mod.bootJson;
            this.AddMod(json);
        }
    }
}
