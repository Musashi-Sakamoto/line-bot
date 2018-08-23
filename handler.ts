import { Handler, Context, Callback} from 'aws-lambda'
import { Client, TextMessage } from '@line/bot-sdk'
import * as crypto from 'crypto'

interface Response {
  statusCode: number
  headers: any
  body: string
}

interface Body {
  events: Event[]
}

interface Event {
  replyToken: string
  message: Message
}

interface Message {
  text: string
}

const client = new Client({channelAccessToken: process.env.ACCESSTOKEN || ""})

const hello: Handler = (event: any, context: Context, callback: Callback) => {
  let signature = crypto.createHmac('sha256', process.env.CHANNELSECRET || "").update(event.body).digest('base64')
  let checkHeader: string = (event.headers)['X-Line-Signature']
  let body: Body = JSON.parse(event.body)
  if (signature === checkHeader) {
    if (body.events[0].replyToken === '00000000000000000000000000000000') {
      let lambdaResponse: Response = {
        statusCode: 200,
        headers: {'X-Line-Status': 'OK'},
        body: JSON.stringify({
          result: "connect check"
        })
      }
      context.succeed(lambdaResponse)
    } else {
      let text = body.events[0].message.text
      const message: TextMessage = {
        type: 'text',
        text: text
      }
      client.replyMessage(body.events[0].replyToken, message)
        .then((_) => {
          let lambdaResponse: Response = {
            statusCode: 200,
            headers: {"X-Line-Status": "OK"},
            body: JSON.stringify({
              result: "completed"
            })
          }
          context.succeed(lambdaResponse)
        }).catch((err) => {
          console.log(err)
        })
    }
  } else {
    console.log('署名認証エラー')
  }
};

export { hello }