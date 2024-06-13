import {get, isString, isArray, every, isObject} from 'lodash';

export interface downloadDir
{
    modName: string;
    downloadDir: string;
}



/**
 *
 * Represents the parameters required for downloading dependencies.
 */
export interface DependencyDownloadParams {
    addr: downloadDir[];
}

export function checkdownloadDirObject(c: any) : c is downloadDir {
    return isObject(c)
        && isString(get(c, 'modName'))
        && isString(get(c, 'downloadDir'))
        ;
}

export function checkAddrArray(c: any) : c is downloadDir[] {
    return isObject(c)
        && isArray(c) && every(c, checkdownloadDirObject);
}


