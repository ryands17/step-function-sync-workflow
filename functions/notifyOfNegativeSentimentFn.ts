import { SESV2 } from 'aws-sdk'

const ses = new SESV2({ region: process.env.AWS_REGION })

export const handler = async (event: any) => {
  const Data = `Sentiment analysis: ${event.sentimentResult.Payload.Sentiment}
Feedback from customer: ${event.message}`

  await ses
    .sendEmail({
      FromEmailAddress: process.env.SENDER,
      Destination: {
        ToAddresses: [process.env.RECEIVER],
      },
      Content: {
        Simple: {
          Subject: { Charset: 'UTF-8', Data: 'Feedback form submission' },
          Body: { Text: { Charset: 'UTF-8', Data } },
        },
      },
    })
    .promise()

  return {
    body: 'Feedback submitted successfully!',
  }
}
