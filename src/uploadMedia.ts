import { TwitterApi } from "twitter-api-v2";
import token from "./lib/tokens.js";
import path from 'node:path';




//Auth

try {
	const client = new TwitterApi({
		appKey: token.consumer_key,
		appSecret: token.consumer_secret,
		accessToken: token.access_token,
		accessSecret: token.access_token_secret
	});
	const imagePath = path.join('D:', 'sandbox', 'image-momiji.png');
	const mediaId = await client.v1.uploadMedia(imagePath)
	console.log(mediaId);
} catch (e) {
	console.log(`user auth failed ${e}`);

}


/*
select a file
check dir
if empty then exit the program
get the first file path
check the file requirement - if failed to pass, then move the file to failed dir.
upload it
log it
check the number of remaining files
if > 0 then send a email
create a post
post
get the post id
log it
*/
