import { Comprehend } from 'aws-sdk'

const cp = new Comprehend({ apiVersion: '2017-11-27' })

type Event = {
  message: string
}

export const handler = async (event: Event) => {
  const data = await cp
    .detectSentiment({
      LanguageCode: 'en',
      Text: event.message,
    })
    .promise()

  return data
}
