import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {LoadingProgress} from "./LoadingProgress";
import JSZip from 'jszip';

export class DebugExport {
    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
        public gLoadingProgress: LoadingProgress,
    ) {
    }

    async exportData(passageDir = false) {
        const zip = new JSZip();

        this.gSC2DataManager.flushAfterPatchCache();
        const sc = this.gSC2DataManager.getSC2DataInfoAfterPatch();
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

