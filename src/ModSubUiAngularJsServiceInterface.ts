import type {
    ModSubUiAngularJsModeExportInterface
} from '../../ModSubUiAngularJs/dist-ts/ModSubUiAngularJsModeExportInterface';

export interface ModSubUiAngularJsServiceLifeTimeCallback {
    whenCreate?: (ref: ModSubUiAngularJsModeExportInterface) => Promise<any>;

    whenDestroy?: (ref: ModSubUiAngularJsModeExportInterface) => Promise<any>;
}

