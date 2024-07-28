import {ModUtils} from "../../../dist-BeforeSC2/Utils";


export class ModSubUiAngularJsService {

    get modSubUiAngularJs() {
        // console.log('get modSubUiAngularJs', this.modUtils.getMod('ModSubUiAngularJs'));
        return this.modUtils.getMod('ModSubUiAngularJs')?.modRef
    }

    get Ref() {
        return this.modSubUiAngularJs;
    }


    constructor(
        public modUtils: ModUtils,
    ) {
    }

    bootstrap(el: HTMLElement) {
        if (!this.Ref) {
            // ignore
            return;
        }
        this.Ref.installBuildInComponent();
        this.addShowComponentList();
        console.log('bootstrapModGuiConfig', [el, this.Ref, this.Ref.appContainerManager]);
        this.Ref.bootstrapModGuiConfig(el);
    }

    release() {
        if (!this.Ref) {
            // ignore
            return;
        }
        console.log('releaseModGuiConfig', [this.Ref, this.Ref.appContainerManager]);
        this.Ref.releaseModGuiConfig();
    }

    showListAdded = false;

    addShowComponentList() {
        if (!this.Ref) {
            // ignore
            return;
        }
        if (this.showListAdded) {
            return;
        }
        this.showListAdded = true;

        this.Ref.addComponentModGuiConfig({
            selector: 'enable-order-component',
            data: {
                listEnabled: Array.from({length: 10}).map((v, i) => {
                    return {
                        key: i,
                        str: `name-${i}`,
                        selected: false,
                    };
                }).concat([
                    {
                        key: 100,
                        str: `name------------------+++++++++++++++++++++++++++++++------------100`,
                        selected: false,
                    },
                    {
                        key: 101,
                        str: `name-101`,
                        selected: false,
                    },
                ]),
                listDisabled: Array.from({length: 10}).map((v, i) => {
                    return {
                        key: i + 1000,
                        str: `nameA-${i}`,
                        selected: false,
                    };
                }).concat([
                    {
                        key: 100 + 1000,
                        str: `nameA------------------+++++++++++++++++++++++++++++++------------100`,
                        selected: false,
                    },
                    {
                        key: 101 + 1000,
                        str: `nameA-101`,
                        selected: false,
                    },
                ]),
                onChange: () => {
                    console.log('onChange', Array.from(arguments));
                },
                noHrSplit: true,
                buttonClass: 'btn btn-sm btn-secondary',
                text:{
                    MoveSelectedItemUp: 'Move Up',
                    MoveSelectedItemDown: 'Move Down',
                    MoveEnabledSelectedItemUp: 'Move Up EnabledItem',
                    MoveEnabledSelectedItemDown: 'Move Down EnabledItem',
                }
            },
        });

    }

}

