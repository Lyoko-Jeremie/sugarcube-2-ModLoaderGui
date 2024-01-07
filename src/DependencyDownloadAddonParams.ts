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

export function checkAddrObject(c: any) : c is DependencyDownloadParams {
    return isObject(c)
        && isArray(get(c, 'addr')) && every(get(c, 'addr'), checkdownloadDirObject);
}


