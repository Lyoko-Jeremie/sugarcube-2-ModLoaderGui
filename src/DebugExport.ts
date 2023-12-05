import type {AddonPluginManager} from "../../../dist-BeforeSC2/AddonPlugin";
import type {ModLoadController} from "../../../dist-BeforeSC2/ModLoadController";
import type {ModOrderItem} from "../../../dist-BeforeSC2/ModOrderContainer";
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {LoadingProgress} from "./LoadingProgress";
import JSZip from 'jszip';

export class DebugExport {

    public addonPluginManager: AddonPluginManager;
    public modLoadController: ModLoadController;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
        public gLoadingProgress: LoadingProgress,
    ) {
        this.addonPluginManager = this.gSC2DataManager.getAddonPluginManager();
        this.modLoadController = this.gSC2DataManager.getModLoadController();
    }

    async exportData(passageDir = false) {
        const zip = new JSZip();

        this.gSC2DataManager.flushAfterPatchCache();
        const sc = this.gSC2DataManager.getSC2DataInfoAfterPatch();

        zip.file(`tree.json`, JSON.stringify(
            {
                css: sc.styleFileItems.items.map(T => {
                    const a = {
                        ...T,
                    };
                    // @ts-ignore
                    delete a.content;
                    return a;
                }),
                js: sc.scriptFileItems.items.map(T => {
                    const a = {
                        ...T,
                    };
                    // @ts-ignore
                    delete a.content;
                    return a;
                }),
                passage: sc.passageDataItems.items.map(T => {
                    const a = {
                        ...T,
                    };
                    // @ts-ignore
                    delete a.content;
                    return a;
                }),
            },
            undefined, 2,
        ));

        for (const item of sc.styleFileItems.items) {
            zip.file(`css/${item.name}`, item.content);
        }
        for (const item of sc.scriptFileItems.items) {
            zip.file(`js/${item.name}`, item.content);
        }
        for (const item of sc.passageDataItems.items) {
            // console.log('passage', [item.name, item.content]);
            const data = `:: ${item.name}`
                + `${item.tags.length === 0 ? '' : (' [' + item.tags[0] + ']')}`
                + `\n${item.content}`;
            // console.log('passage', [item.name, item.tags, data,]);
            if (!passageDir) {
                zip.file(
                    `passage/${item.name}.twee`,
                    data,
                );
            } else {
                zip.file(
                    `passage/${item.name.split(' ')[0]}/${item.name}.twee`,
                    data,
                );
            }
        }
        this.gSC2DataManager.flushAfterPatchCache();

        await this.addonPluginManager.exportDataZip(zip);
        await this.modLoadController.exportDataZip(zip);

        const scriptNodeList = Array.from(this.gSC2DataManager.scriptNode);
        for (let i = 0; i !== scriptNodeList.length; ++i) {
            const n = scriptNodeList[i];
            zip.file(
                `scriptNode/${i}.js`,
                n.innerHTML,
            );
        }

        const modList = this.gSC2DataManager.getModLoader().getModReadCache().get_Array();
        for (const mod of modList) {
            await this.exportMod(zip, mod);
        }

        zip.file(
            `ModLoaderLog.txt`,
            this.gLoadingProgress.getLoadLog().join('\n'),
        );

        const blob = await zip.generateAsync({
            type: "blob",
            // compression: "DEFLATE",
            // compressionOptions: {level: 0},
        });
        return blob;
    }

    async exportMod(zip: JSZip, mod: ModOrderItem) {
        const prefix = 'ExportLoadedModScript';
        // mod.mod.bootJson;
        // mod.mod.scriptFileList_preload;
        // mod.mod.scriptFileList_inject_early;
        // mod.mod.scriptFileList_earlyload;
        zip.file(`${prefix}/${mod.mod.name}/boot.json`, JSON.stringify(mod.mod.bootJson, undefined, 2));
        for (const item of mod.mod.scriptFileList_preload) {
            zip.file(`${prefix}/${mod.mod.name}/scriptFileList_preload/${item[0]}`, item[1]);
        }
        for (const item of mod.mod.scriptFileList_inject_early) {
            zip.file(`${prefix}/${mod.mod.name}/scriptFileList_inject_early/${item[0]}`, item[1]);
        }
        for (const item of mod.mod.scriptFileList_earlyload) {
            zip.file(`${prefix}/${mod.mod.name}/scriptFileList_earlyload/${item[0]}`, item[1]);
        }
    }

    createDownload(blob: Blob, fileName: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1000);
    }

}

