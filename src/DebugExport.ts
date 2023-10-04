import type {AddonPluginManager} from "../../../dist-BeforeSC2/AddonPlugin";
import {ModLoadController} from "../../../dist-BeforeSC2/ModLoadController";
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
            if (!passageDir) {
                zip.file(
                    `passage/${item.name}.twee`,
                    `:: ${item.name}\n${item.content}`,
                );
            } else {
                zip.file(
                    `passage/${item.name.split(' ')[0]}/${item.name}.twee`,
                    `:: ${item.name}\n${item.content}`,
                );
            }
        }
        this.gSC2DataManager.flushAfterPatchCache();

        await this.addonPluginManager.exportDataZip(zip);
        await this.modLoadController.exportDataZip(zip);

        const blob = await zip.generateAsync({
            type: "blob",
            // compression: "DEFLATE",
            // compressionOptions: {level: 0},
        });
        return blob;
    }

    createDownload(blob: Blob, fileName: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

}

