import parseHTML from "posthtml-parser";
import _, { first } from "underscore";

function getDepthOfTree(tree: parseHTML.Tree, indexList: number[]): parseHTML.Tree {
	if (indexList.length) {
		const _indexList = _.clone(indexList);
		const index = _indexList.splice(0, 1)[0];
		const node = tree[index];
		if (typeof (node) === "string" || !node.content) {
			return [node];
		}
		return getDepthOfTree(node.content, _indexList);
	} else {
		return tree;
	}
}

function findNodeIndex(baseTree: parseHTML.Tree, condition: (node: parseHTML.Node) => boolean, offset: number[]): number[] {
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
			} else if (typeof (node) !== "string") {
				queue.push(newList);
			}
		}
	}
	return null;
}

function findNodeIndexByContent(baseTree: parseHTML.Tree, label: string, offset: number[]): number[] {
	return findNodeIndex(baseTree, (node) => {
		return node === label;
	}, offset);
}

function findNodeIndexByAttribute(baseTree: parseHTML.Tree, key: string, value: string, offset: number[]): number[] {
	return findNodeIndex(baseTree, (node) => {
		return typeof (node) !== "string" && node.attrs && node.attrs[key] === value;
	}, offset);
}

function findNodeIndexByTag(baseTree: parseHTML.Tree, tag: string, offset: number[]): number[] {
	return findNodeIndex(baseTree, (node) => {
		return typeof (node) !== "string" && node.tag === tag;
	}, offset);
}

export class User {
	content: parseHTML.Tree;
	name: string;
	hp: number;
	mp: number;
	li: number;
	ti: number;
	min: number;
	ji: number;
	hun: number;
	nian: number;
	parseNameAndLevel() {
		let namePos = findNodeIndexByAttribute(this.content, "class", "sTitle", []);
		this.name = getDepthOfTree(this.content, namePos.concat([0]))[0] as string;
		
	}
	parseBasicAttributes() {
		let hpStringPos = findNodeIndexByContent(this.content, "命", []);
		hpStringPos[hpStringPos.length - 2] += 2;
		const datas: number[] = []
		for (let i = 0; i < 8; ++i) {
			const rawData = getDepthOfTree(this.content, hpStringPos)[0] as string;
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
	constructor(content: string) {
		this.content = parseHTML(content);
		this.parse();
		this.content = null;
	}
}
