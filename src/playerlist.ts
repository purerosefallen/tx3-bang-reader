import HTML from "posthtml-parser";
import _, { first } from "underscore";
import {getDepthOfTree, getNumber, findNodeIndex, findNodeIndexByAttribute, findNodeIndexByContent, findNodeIndexByTag, findAllNodeIndex, getContinuousData, getContinuousNodes, getString} from "./utility";

export interface PlayerRow {
	url: string;
	rank: number;
	name: string;
	category: string;
	serverArea: string;
	server: string;
	level: number;
	region: string;
	score: number;
	equip: number;
	totalScore: number;
}

export interface PlayerRowDated extends PlayerRow {
	date: string;
}

function getPlayerRowFromTree(tree: HTML.Tree): PlayerRow {
	const nodes = getContinuousNodes(tree, [1], 0, 2, 10);
	return {
		url: (nodes[1] as HTML.NodeTag).attrs.href as string,
		rank: getNumber(nodes[0]),
		name: getString(nodes[1], 7),
		serverArea: getString(nodes[2]),
		server: getString(nodes[3]),
		level: getNumber(nodes[4]),
		category: getString(nodes[5]),
		region: getString(nodes[6], 7) || "none",
		score: getNumber(nodes[7]),
		equip: getNumber(nodes[8]),
		totalScore: getNumber(nodes[9])
	}
}



export function parsePlayerRows(content: string) {
	const parsedContent = HTML(content);
	const tablePos = findNodeIndexByTag(parsedContent, "table", []);
	const tableTree = getDepthOfTree(parsedContent, tablePos);
	const playerPoses = findAllNodeIndex(tableTree, (node) => {
		return typeof (node) !== "string" && node.tag === "tr" && node.attrs.class !== "trTop2";
	}, []);
	return playerPoses.map(pos => {
		const tree = getDepthOfTree(tableTree, pos);
		return getPlayerRowFromTree(tree);
	});
}
