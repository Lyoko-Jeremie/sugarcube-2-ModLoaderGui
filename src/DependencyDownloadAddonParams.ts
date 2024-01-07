import {get, isString, isArray, every, isObject} from 'lodash';

export interface downloadDir
{
    modName: string;
    downloadDir: string;
}


/*
"Dependence" 和 "Dependency" 都与依赖关系有关，但在特定上下文中，它们有所不同。一般情况下，"Dependence" 更多地表达的是 "依赖" 这一动态关系，而 "Dependency" 的含义则更偏向于 "依赖项" 这种静态的存在。
在软件开发领域，当我们说 "Dependency" 时，更多的是指项目的外部依赖。例如，在一个 JavaScript 项目中，你可能会有许多 npm packages 作为你的 "Dependencies"。在这个场景下，"Dependency" 是具体的库或者模块，它是一个静态的存在。
此外，"Dependency" 也常常用于描述对象之间的关系，在面向对象的编程中，一个对象依赖于另一个对象，我们通常称这种关系为 "Dependency"。
然而，“Dependence”通常用于描述抽象的、非具体物质的依赖关系，例如“他对咖啡有依赖性”（He has a dependence on coffee）。
请注意，这些只是大体规则的说明，不同的人可能在实际语境中根据习惯用法或行业标准稍作调整使用这两个词汇。在具体语境中，最好还是遵循实际使用的约定或标准。
 */
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


