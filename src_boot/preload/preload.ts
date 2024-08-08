(async () => {
    console.log('ModLoaderGui preload start');

    $(document).one(":storyready", function () {
        console.log('ModLoaderGui preload storyready');
        window.modLoaderGui_LoadingProgress.allStart();
    });

    // window.jQuery(document).one(":passageinit", () => {
    //     console.log('modLoaderGui patchVersionString');
    //     window.modLoaderGui.patchVersionString();
    // });
})();

