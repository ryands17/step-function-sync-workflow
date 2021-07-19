import { ulid } from 'ulid'

export const handler = async () => {
  return ulid()
}
