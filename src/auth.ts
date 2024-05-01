import {TwitterApi } from "twitter-api-v2";
import express from "express";
import session from "express-session";
import {OAuth}  from "oauth";

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: "development" | "production" | "local";
			[key: string]: string;
		}
	}
}

/*
https://twitter.com/AIArtsbyBDC?state=my-state&code=U1l6OHBCSW5yV0ZoT0lXNTJpTHlvWklJTGNRZWVsU0JLQUxYVS1lMGZCS3o1OjE3MTI2NzA0NzQ3Nzk6MToxOmFjOjE
https://twitter.com/AIArtsbyBDC?state=my-state&code=MWxsNkVqOGxXWGstRnRySFZlQ3RDNEEtS3NUMGZKM1JaZnBRSEtDeHpBUVhqOjE3MTI3NDc5MzEwNDc6MToxOmFjOjE
*/

const token = {
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	client_id: process.env.CLIENT_ID,
	client_secret: process.env.CLIENT_SECRET,
	access_token: process.env.ACCESS_TOKEN,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET,
	bearer_token: process.env.BEARER_TOKEN,
	code: process.env.CODE,
	oauth_token: process.env.OAUTH_TOKEN,
	oauth_verifier: process.env.OAUTH_VERIFIER
};


const app = express();
app.use(
	session({
		name: 'tweetbot',
		secret: 'tweetbot',
		resave: true,
		saveUninitialized: true,
	}),
);

declare module "express-session" {
	interface SessionData {
		oauth_token: string;
		oauth_token_secret: string;
		access_token: string;
		access_token_secret: string;
	}
}


// Create an OAuth object

const oauth = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  token.consumer_key,
  token.consumer_secret,
  '1.0A',
  process.env.CALLBACK_URL,
  'HMAC-SHA1'
);

app.get('/login', (req, res) => {
  oauth.getOAuthRequestToken((error, oauth_token, oauth_token_secret, _) => {

    if (error) {
      console.error('Error getting OAuth request token:', error);
		res.status(500).send('Error getting OAuth request token');
    } else {
      // Store the oauth_token and oauth_token_secret for later use
      req.session.oauth_token = oauth_token;
		req.session.oauth_token_secret = oauth_token_secret;
		console.log(`oauth_token\r\n${oauth_token}`);
		console.log(`oauth_token_secret\r\n${oauth_token_secret}`);

      // Redirect the user to the Twitter authorization page
      res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${oauth_token}`);
    }
  });
});

app.get('/callback', (req, res) => {
  // Extract tokens from query string
  const { oauth_token, oauth_verifier } = req.query;
  // Get the saved oauth_token_secret from session
  const { oauth_token_secret } = req.session;

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    res.status(400).send('You denied the app or your session expired!');
  }else{

  // Obtain the persistent tokens
  // Create a client from temporary tokens

	const client = new TwitterApi({clientId: token.client_id, clientSecret: token.client_secret});

  client.login(oauth_verifier as string)
    .then(({ client: _, accessToken, accessSecret }) => {
      // loggedClient is an authenticated client in behalf of some user
		// Store accessToken & accessSecret somewhere
		req.session.access_token = accessToken;
      req.session.access_token_secret = accessSecret;
      console.log("access token", accessToken);
      console.log("access secret", accessSecret);
    })
      .catch(() => res.status(403).send('Invalid verifier or access tokens!'));

    }
});
/*
app.get('/callback', (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;

  oauth.getOAuthAccessToken(
    req.session.oauth_token as string,
    req.session.oauth_token_secret as string,
    oauth_verifier as string,
	  (error, access_token, access_token_secret, results) => {
		  console.log(oauth_token, results);
      if (error) {
        console.error('Error getting OAuth access token:', error);
        res.status(500).send('Error getting OAuth access token');
      } else {
        // Store the access_token and access_token_secret for later use
        req.session.access_token = access_token;
        req.session.access_token_secret = access_token_secret;

        // You can now use the access_token and access_token_secret to make API requests on behalf of the user
        res.redirect('/dashboard');
      }
    }
  );
});
*/
// Route to access the user's dashboard
app.get('/dashboard', (req, res) => {
  // Check if the user has an access token
  if (req.session.access_token && req.session.access_token_secret) {
    // Use the access token and access token secret to make API requests
    // For example, you can use the `oauth.get` method to fetch the user's timeline:
    oauth.get(
      'https://api.twitter.com/1.1/statuses/home_timeline.json',
      req.session.access_token,
      req.session.access_token_secret,
      (error, data, _) => {
        if (error) {
          console.error('Error fetching user timeline:', error);
          res.status(500).send('Error fetching user timeline');
        } else {
          // Render the user's dashboard with the timeline data
          res.render('dashboard', { timeline: JSON.parse(data as string) });
        }
      }
    );
  } else {
    // Redirect the user to the login page
    res.redirect('/login');
  }
});



/*
const authClient = new auth.OAuth2User({
	client_id: token.client_id,
	client_secret: token.client_secret,
	callback: "https://twitter.com/AIArtsbyBDC",
	scopes: ["tweet.read", "users.read", "offline.access"],
});

const client = new Client(authClient);

//const STATE = "my-state";


/*
app.get("/login", async function (_, res) {
	const authUrl = authClient.generateAuthURL({
		state: STATE,
		code_challenge_method: "s256",
	});
	res.redirect(authUrl);
});


app.get("/tweets", async function (_, res) {
	const tweets = await client.tweets.findTweetById("20");
	res.send(tweets.data);
});

app.get("/revoke", async function (_, res) {
	try {
		const response = await authClient.revokeAccessToken();
		res.send(response);
	} catch (error) {
		console.log(error);
	}
});
*/

app.listen(3333, () => {
  console.log('Server is running on http://127.0.0.1:3333/login');
});
