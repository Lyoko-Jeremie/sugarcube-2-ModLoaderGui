export const KeyFilter: { [key in string]: ((event: KeyboardEvent) => boolean) } = {
    open: (event: KeyboardEvent) => {
        return (event.altKey || event.metaKey) &&
            (event.key === 'M' || event.key === 'm' ||
                // for Mac `metaKey+M`
                event.keyCode === 'M'.charCodeAt(0));
    },
    exportData: (event: KeyboardEvent) => {
        return event.altKey && event.ctrlKey && (event.key === 'D' || event.key === 'd' || event.keyCode === 'D'.charCodeAt(0));
    }
}
