import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {
    ModSubUiAngularJsModeExportInterface
} from '../../ModSubUiAngularJs/dist-ts/ModSubUiAngularJsModeExportInterface';
import {ModSubUiAngularJsServiceLifeTimeCallback} from "./ModSubUiAngularJsServiceInterface";


export class ModSubUiAngularJsService {

    protected lifeTimeCallbackTable: Map<string, ModSubUiAngularJsServiceLifeTimeCallback> = new Map<string, ModSubUiAngularJsServiceLifeTimeCallback>();

    protected get modSubUiAngularJs(): ModSubUiAngularJsModeExportInterface | undefined {
        // console.log('get modSubUiAngularJs', this.modUtils.getMod('ModSubUiAngularJs'));
        return this.modUtils.getMod('ModSubUiAngularJs')?.modRef as any
    }

    get Ref() {
        // return undefined;
        return this.modSubUiAngularJs;
    }

    constructor(
        public modUtils: ModUtils,
    ) {
    }

    addLifeTimeCallback(name: string, callback: ModSubUiAngularJsServiceLifeTimeCallback) {
        if (this.lifeTimeCallbackTable.has(name)) {
            console.error(`[ModSubUiAngularJsService] addLifeTimeCallback: name already exists:`, [name]);
            throw new Error(`[ModSubUiAngularJsService] addLifeTimeCallback: name already exists: [${name}]`);
        }
        this.lifeTimeCallbackTable.set(name, callback);
    }

    removeLifeTimeCallback(name: string) {
        this.lifeTimeCallbackTable.delete(name);
    }

    async bootstrap(el: HTMLElement) {
        if (!this.Ref) {
            // ignore
            return;
        }
        this.Ref.installBuildInComponent();
        for (const c of this.lifeTimeCallbackTable.values()) {
            c.whenCreate && await c.whenCreate(this.Ref);
        }
        console.log('bootstrapModGuiConfig', [el, this.Ref, this.Ref.appContainerManager]);
        this.Ref.bootstrapModGuiConfig(el);
    }

    async release() {
        if (!this.Ref) {
            // ignore
            return;
        }
        for (const c of this.lifeTimeCallbackTable.values()) {
            c.whenDestroy && await c.whenDestroy(this.Ref);
        }
        console.log('releaseModGuiConfig', [this.Ref, this.Ref.appContainerManager]);
        this.Ref.releaseModGuiConfig();
    }

}

