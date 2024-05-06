import X from "@/auth.js";
import updateHistory from "@/history.js";
import * as img from "@/imageHandler.js";
import Log from "@/logger.js";
import sendMail from "@/mailer.js";
import { createPost } from "@/post.js";

const intervalInMS = Number(process.env.POST_INTERVAL_MM) * 60 * 1000; // minutes * 60sec/1min * 1000ms/1sec

//Run createPost in a given intervals.
setInterval(async () => {
	let res: Partial<createPostRes> = {};
	try {
		res = (await EBretry(
			createPost,
			Number(process.env.RETRY_COUNT),
			Number(process.env.RETRY_WAIT_MS),
		)) as createPostRes;
		Log.info("createPost", `Post uploaded successfully with id:${res.id}`);
	} catch (e) {
		Log.fatal("EBretry", `upload failed ${process.env.RETRY_COUNT}times.  ${e}`);
		sendMail.postFialed();
		console.log(`Retry reached ${process.env.RETRY_COUNT}.  Exiting program.`);
		process.exit(1);
	}

	try {
		const uploadedPath = await img.moveImage(res.imgFilePath as string, process.env.IMG_UPLOADED_DIR_PATH);
		await Log.info("createPost", `Tweeted with id ${res.id}`);
		await updateHistory(res.id as string, res.mediaId as string, uploadedPath);
	} catch (e) {
		Log.error("washup", `Washup tasks failed due to ${e}`);
		throw new Error(`${e}`);
	}
}, intervalInMS);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function EBretry(fn: () => any, retryCnt: number, waitMS: number) {
	let attempt = 0;

	return await retry();

	async function retry() {
		let res: Partial<createPostRes> = {};
		try {
			res = await fn();
			console.log("Post uploaded successfully");
		} catch (e) {
			if (retryCnt === attempt) {
				throw new Error(`${e}`);
			}
			const sleep = 2 ** attempt * waitMS;
			attempt++;
			console.log(`Attempt:${attempt} failed.  Retrying in ${sleep / 1000} seconds...`);
			Log.error("EBretry", `upload attempt #${attempt} failed due to ${e}.  Retry in ${sleep / 1000} seconds...`);
			setTimeout(async () => {
				await retry();
			}, sleep);
			return false;
		}
		if (res) return res as createPostRes;
	}
}

export default EBretry;
