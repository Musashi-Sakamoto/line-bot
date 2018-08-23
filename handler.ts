import { Handler, Context, Callback } from "aws-lambda";
import { Client, TextMessage } from "@line/bot-sdk";
import * as crypto from "crypto";
import * as Axios from "axios";

interface Response {
  statusCode: number;
  headers: any;
  body: string;
}

interface Body {
  events: Event[];
}

interface Event {
  replyToken: string;
  message: Message;
}

interface Message {
  text: string;
}

interface Results {
  response: IResponse;
}

interface IResponse {
  videos: Video[];
}

interface Video {
  title: string;
  video_url: string;
}

const client = new Client({
  channelAccessToken: process.env.ACCESSTOKEN || ""
});

const hello: Handler = (event: any, context: Context, callback: Callback) => {
  let signature = crypto
    .createHmac("sha256", process.env.CHANNELSECRET || "")
    .update(event.body)
    .digest("base64");
  let checkHeader: string = event.headers["X-Line-Signature"];
  let body: Body = JSON.parse(event.body);
  if (signature === checkHeader) {
    if (body.events[0].replyToken === "00000000000000000000000000000000") {
      let lambdaResponse: Response = {
        statusCode: 200,
        headers: { "X-Line-Status": "OK" },
        body: JSON.stringify({
          result: "connect check"
        })
      };
      context.succeed(lambdaResponse);
    } else {
      let text = body.events[0].message.text;

      const AVGLE_SEARCH_VIDEOS_API_URL = `https://api.avgle.com/v1/search/${encodeURIComponent(
        text
      )}/0?limit=1`;
      Axios.default
        .get(AVGLE_SEARCH_VIDEOS_API_URL)
        .then(response => {
          let results: Results = response.data;
          let video = results.response.videos[0];
          return Promise.resolve(video.video_url);
        })
        .then(url => {
          const message: TextMessage = {
            type: "text",
            text: url
          };
          return client.replyMessage(body.events[0].replyToken, message);
        })
        .then(_ => {
          let lambdaResponse: Response = {
            statusCode: 200,
            headers: { "X-Line-Status": "OK" },
            body: JSON.stringify({
              result: "completed"
            })
          };
          context.succeed(lambdaResponse);
        })
        .catch(err => {
          console.log(err);
        });
    }
  } else {
    console.log("署名認証エラー");
  }
};

export { hello };
