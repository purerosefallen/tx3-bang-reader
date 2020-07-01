import HTML from "posthtml-parser";
import _, { first } from "underscore";

function getDepthOfTree(tree: HTML.Tree, indexList: number[]): HTML.Tree {
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

function findNodeIndex(baseTree: HTML.Tree, condition: (node: HTML.Node) => boolean, offset: number[]): number[] {
	let queue = [offset];
	while (queue.length) {
		const indexList = queue.splice(0, 1)[0];
		const tree = getDepthOfTree(baseTree, indexList);
		for (let i = 0; i < tree.length; ++i) {
			const node = tree[i];
			const newList = indexList.concat([i]);
			if (condition(node)) {
				//console.log(newList);
				return newList;
			} else if (typeof (node) !== "string") {
				queue.push(newList);
			}
		}
	}
	return null;
}

function findNodeIndexByContent(baseTree: HTML.Tree, label: string, offset: number[]): number[] {
	return findNodeIndex(baseTree, (node) => {
		return node === label;
	}, offset);
}

function findNodeIndexByAttribute(baseTree: HTML.Tree, key: string, value: string, offset: number[]): number[] {
	return findNodeIndex(baseTree, (node) => {
		return typeof (node) !== "string" && node.attrs && node.attrs[key] === value;
	}, offset);
}

function findNodeIndexByTag(baseTree: HTML.Tree, tag: string, offset: number[]): number[] {
	return findNodeIndex(baseTree, (node) => {
		return typeof (node) !== "string" && node.tag === tag;
	}, offset);
}

const chineseCapitalNumbers = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"]

function getNumber(node: HTML.Node) {
	let numberStr: string;
	if (typeof (node) === "string") {
		numberStr = node;
	} else {
		const subTree = node.content;
		if (!subTree) {
			return null;
		}
		numberStr = subTree[0] as string;
	}
	numberStr = numberStr.trim();
	let stringMatch: RegExpMatchArray;
	if (numberStr === "没有上榜") {
		return null;
	} else if (stringMatch = numberStr.match(/^([天地])魂$/)) {
		return stringMatch[1] === "天" ? 2 : 1;
	} else if (stringMatch = numberStr.match(/^(.+)天(.+)境界$/)) {
		return (_.findIndex(chineseCapitalNumbers, (m) => m === stringMatch[1]) << 4) | _.findIndex(chineseCapitalNumbers, (m) => m === stringMatch[2]);
	} else if (stringMatch = numberStr.match(/^(\d+)-(\d+)$/)) {
		const minValue = parseInt(stringMatch[1]);
		const maxValue = parseInt(stringMatch[2]);
		return (minValue << 16) | maxValue;
	} else {
		return parseInt(numberStr);
	}
}

export class User {
	content: HTML.Tree;
	name: string;
	category: string;
	serverArea: string;
	server: string;
	level: number;
	equipValue: number;
	equipRank: number;
	equipLocalRank: number;
	equipCategoryRank: number;
	scoreValue: number;
	scoreRank: number
	scoreLocalRank: number;
	scoreCategoryRank: number;
	sqStage: number;
	sqLevel: number;
	qhLevel: number;
	tlPoints: number;
	hp: number;
	mp: number;
	li: number;
	ti: number;
	min: number;
	ji: number;
	hun: number;
	nian: number;
	getContinuousData(_pos: number[], moveOffset: number, step: number, dataCount: number): number[] {
		const pos = _.clone(_pos);
		const datas: number[] = [];
		for (let i = 0; i < dataCount; ++i) { 
			const node = getDepthOfTree(this.content, pos)[0];
			datas.push(getNumber(node))
			pos[pos.length - (moveOffset + 1)] += step;
		}
		return datas;
	}
	parseMetadata() {
		let namePos = findNodeIndexByAttribute(this.content, "class", "sTitle", []);
		this.name = getDepthOfTree(this.content, namePos.concat([0]))[0] as string;
		namePos[namePos.length - 1] += 2;
		this.category = getDepthOfTree(this.content, namePos.concat([0, 0]))[0] as string;
		namePos[namePos.length - 1] += 2;
		[this.serverArea, this.server] = (getDepthOfTree(this.content, namePos.concat([0, 0]))[0] as string).split("&nbsp;");

		let levelPos = findNodeIndexByContent(this.content, "等级", []);
		levelPos.pop();
		levelPos[levelPos.length - 1]++;
		this.level = getNumber(getDepthOfTree(this.content, levelPos)[0]);
	}
	parseEquipmentData() {
		let ValuePos = findNodeIndexByContent(this.content, "装备评价:", []);
		ValuePos.pop();
		ValuePos[ValuePos.length - 1]++;
		let datas = this.getContinuousData(ValuePos, 1, 2, 4);
		this.equipValue = datas[0];
		this.equipRank = datas[1];
		this.equipLocalRank = datas[2];
		this.equipCategoryRank = datas[3];

		ValuePos = findNodeIndexByContent(this.content, "人物修为:", []);
		ValuePos.pop();
		ValuePos[ValuePos.length - 1]++;
		datas = this.getContinuousData(ValuePos, 1, 2, 8);
		this.scoreValue = datas[0];
		this.scoreRank = datas[1];
		this.scoreLocalRank = datas[2];
		this.scoreCategoryRank = datas[3];
		this.sqStage = datas[4];
		this.sqLevel = datas[5];
		this.qhLevel = datas[6];
		this.tlPoints = datas[7];
	}
	parseBasicAttributes() {
		let ValuePos = findNodeIndexByContent(this.content, "命", []);
		ValuePos.pop()
		ValuePos[ValuePos.length - 1] += 2;
		const datas = this.getContinuousData(ValuePos, 0, 4, 8);
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
		this.parseMetadata();
		this.parseEquipmentData();
		this.parseBasicAttributes();
	}
	constructor(content: string) {
		this.content = HTML(content);
		this.parse();
		this.content = null;
	}
}
