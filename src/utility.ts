import HTML from "posthtml-parser";
import _ from "underscore";
export function getDepthOfTree(tree: HTML.Tree, indexList: number[]): HTML.Tree {
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

export function findNodeIndex(baseTree: HTML.Tree, condition: (node: HTML.Node) => boolean, offset: number[]): number[] {
	const queue = [offset];
	while (queue.length) {
		const indexList = queue.splice(0, 1)[0];
		const tree = getDepthOfTree(baseTree, indexList);
		for (let i = 0; i < tree.length; ++i) {
			const node = tree[i];
			const newList = indexList.concat([i]);
			if (condition(node)) {
				return newList;
			} else if (typeof (node) !== "string") {
				queue.push(newList);
			}
		}
	}
	return null;
}

export function findAllNodeIndex(baseTree: HTML.Tree, condition: (node: HTML.Node) => boolean, offset: number[]): number[][] {
	const queue = [offset];
	const res: number[][] = [];
	while (queue.length) {
		const indexList = queue.splice(0, 1)[0];
		const tree = getDepthOfTree(baseTree, indexList);
		for (let i = 0; i < tree.length; ++i) {
			const node = tree[i];
			const newList = indexList.concat([i]);
			if (condition(node)) {
				//console.log(newList);
				res.push(newList);
			} else if (typeof (node) !== "string") {
				queue.push(newList);
			}
		}
	}
	return res;
}

export function findNodeIndexByContent(baseTree: HTML.Tree, label: string, offset: number[]): number[] {
	return findNodeIndex(baseTree, (node) => {
		return node === label;
	}, offset);
}

export function findNodeIndexByAttribute(baseTree: HTML.Tree, key: string, value: string, offset: number[]): number[] {
	return findNodeIndex(baseTree, (node) => {
		return typeof (node) !== "string" && node.attrs && node.attrs[key] === value;
	}, offset);
}

export function findNodeIndexByTag(baseTree: HTML.Tree, tag: string, offset: number[]): number[] {
	return findNodeIndex(baseTree, (node) => {
		return typeof (node) !== "string" && node.tag === tag;
	}, offset);
}

export function findAllNodeIndexByContent(baseTree: HTML.Tree, label: string, offset: number[]): number[][] {
	return findAllNodeIndex(baseTree, (node) => {
		return node === label;
	}, offset);
}

export function findAllNodeIndexByAttribute(baseTree: HTML.Tree, key: string, value: string, offset: number[]): number[][] {
	return findAllNodeIndex(baseTree, (node) => {
		return typeof (node) !== "string" && node.attrs && node.attrs[key] === value;
	}, offset);
}

export function findAllNodeIndexByTag(baseTree: HTML.Tree, tag: string, offset: number[]): number[][] {
	return findAllNodeIndex(baseTree, (node) => {
		return typeof (node) !== "string" && node.tag === tag;
	}, offset);
}

const chineseCapitalNumbers = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"]

export function getString(node: HTML.Node) {
	let resultStr: string;
	if (typeof (node) === "string") {
		resultStr = node;
	} else {
		const subTree = node.content;
		if (!subTree) {
			return null;
		}
		const subNode = subTree[0];
		if (typeof (subNode) === "string") {
			resultStr = subTree[0] as string;
		} else {
			resultStr = getString(subTree[0]) as string;
		}
	}
	resultStr = resultStr.trim();
	return resultStr;
}

export function getNumber(node: HTML.Node) {
	const numberStr = getString(node);
	let stringMatch: RegExpMatchArray;
	if (numberStr === "没有上榜") {
		return null;
	} else if (stringMatch = numberStr.match(/^([天地])魂$/)) {
		return stringMatch[1] === "天" ? 2 : 1;
	} else if (stringMatch = numberStr.match(/^(.+)天(.+)境界$/)) {
		return (_.findIndex(chineseCapitalNumbers, (m) => m === stringMatch[1]) << 8) | _.findIndex(chineseCapitalNumbers, (m) => m === stringMatch[2]);
	} else if (stringMatch = numberStr.match(/^(\d+)-(\d+)$/)) {
		const minValue = parseInt(stringMatch[1]);
		const maxValue = parseInt(stringMatch[2]);
		return (minValue << 16) | maxValue;
	} else {
		return parseInt(numberStr);
	}
}

export function getContinuousNodes(tree: HTML.Tree, _pos: number[], moveOffset: number, step: number, dataCount: number): HTML.Node[] {
	const pos = _.clone(_pos);
	const datas: HTML.Node[] = [];
	for (let i = 0; i < dataCount; ++i) {
		const node = getDepthOfTree(tree, pos)[0];
		datas.push(node);
		pos[pos.length - (moveOffset + 1)] += step;
	}
	return datas;
}

export function getContinuousData(tree: HTML.Tree, _pos: number[], moveOffset: number, step: number, dataCount: number): string[] {
	return getContinuousNodes(tree, _pos, moveOffset, step, dataCount).map(getString);
}

export function getContinuousNumber(tree: HTML.Tree, _pos: number[], moveOffset: number, step: number, dataCount: number): number[] {
	return getContinuousNodes(tree, _pos, moveOffset, step, dataCount).map(getNumber);
}
