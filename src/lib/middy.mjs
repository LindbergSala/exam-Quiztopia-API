import middy from '@middy/core'
import httpJsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import httpCors from '@middy/http-cors'

const wrap = (fn) =>
  middy(fn)
    .use(httpJsonBodyParser({ disableContentTypeError: true }))
    .use(httpErrorHandler())
    .use(httpCors())

export const withHttp = wrap
export const safeHandler = wrap
