"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const posthtml_parser_1 = __importDefault(require("posthtml-parser"));
const underscore_1 = __importDefault(require("underscore"));
function getDepthOfTree(tree, indexList) {
    if (indexList.length) {
        const _indexList = underscore_1.default.clone(indexList);
        const index = _indexList.splice(0, 1)[0];
        const node = tree[index];
        if (typeof (node) === "string" || !node.content) {
            return [node];
        }
        return getDepthOfTree(node.content, _indexList);
    }
    else {
        return tree;
    }
}
function findNodeIndex(baseTree, condition, offset) {
    let queue = [offset];
    while (queue.length) {
        const indexList = queue.splice(0, 1)[0];
        const tree = getDepthOfTree(baseTree, indexList);
        for (let i = 0; i < tree.length; ++i) {
            const node = tree[i];
            const newList = indexList.concat([i]);
            if (condition(node)) {
                console.log(newList);
                return newList;
            }
            else if (typeof (node) !== "string") {
                queue.push(newList);
            }
        }
    }
    return null;
}
function findNodeIndexByContent(baseTree, label, offset) {
    return findNodeIndex(baseTree, (node) => {
        return node === label;
    }, offset);
}
function findNodeIndexByAttribute(baseTree, key, value, offset) {
    return findNodeIndex(baseTree, (node) => {
        return typeof (node) !== "string" && node.attrs && node.attrs[key] === value;
    }, offset);
}
function findNodeIndexByTag(baseTree, tag, offset) {
    return findNodeIndex(baseTree, (node) => {
        return typeof (node) !== "string" && node.tag === tag;
    }, offset);
}
class User {
    constructor(content) {
        this.content = posthtml_parser_1.default(content);
        this.parse();
        this.content = null;
    }
    parseNameAndLevel() {
        let namePos = findNodeIndexByAttribute(this.content, "class", "sTitle", []);
        this.name = getDepthOfTree(this.content, namePos.concat([0]))[0];
    }
    parseBasicAttributes() {
        let hpStringPos = findNodeIndexByContent(this.content, "命", []);
        hpStringPos[hpStringPos.length - 2] += 2;
        const datas = [];
        for (let i = 0; i < 8; ++i) {
            const rawData = getDepthOfTree(this.content, hpStringPos)[0];
            console.log(rawData);
            datas.push(parseInt(rawData.trim()));
            hpStringPos[hpStringPos.length - 2] += 4;
        }
        this.hp = datas[0];
        this.mp = datas[1];
        this.li = datas[2];
        this.ti = datas[3];
        this.min = datas[4];
        this.ji = datas[5];
        this.hun = datas[6];
        this.nian = datas[7];
    }
    parse() {
        this.parseBasicAttributes();
    }
}
exports.User = User;
//# sourceMappingURL=user.js.map