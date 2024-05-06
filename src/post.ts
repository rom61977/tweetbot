import fsp from "node:fs/promises";
import X from "@/auth.js";
import updateHistory from "@/history.js";
import * as img from "@/imageHandler.js";
import Log from "@/logger.js";

async function lookupPost(id: string) {
	try {
		const status = await X.v1.tweets([id]);
		console.log(status);
	} catch (e) {
		throw new Error(`lookup failed due to ${e}`);
	}
}

async function createPost(): Promise<createPostRes> {
	//prepare image
	let mediaId = "";
	let imgFilePath = "";
	try {
		imgFilePath = await img.selectImageFromRepo(process.env.IMG_REPO_DIR_PATH);
		mediaId = await img.getMediaId(imgFilePath);
	} catch (e) {
		throw new Error(`createPost failed due to ${e}`);
	}

	//prepare body text
	let body = "";
	try {
		const message = await fsp.readFile(process.env.MESSAGE_FILE_PATH, { encoding: "utf8" });
		const hashtag = await fsp.readFile(process.env.HASHTAG_FILE_PATH, { encoding: "utf8" });
		body = `${message}  ${hashtag.split("\r\n").join(" ")}`;
	} catch (e) {
		throw new Error(`createPost failed while loading message and hashtag.  ${e}`);
	}

	//post
	try {
		const res = await X.v2.tweet(body, { media: { media_ids: [mediaId] } });
		return {
			id: res.data.id,
			mediaId: mediaId,
			imgFilePath: imgFilePath,
		};
	} catch (e) {
		throw new Error(`Tweet failed due to ${e}`);
	}
}

export { createPost, lookupPost };
