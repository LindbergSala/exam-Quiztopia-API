import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import httpCors from "@middy/http-cors";

export const withHttp = (handler) =>
  middy(handler)
    .use(httpJsonBodyParser())
    .use(httpErrorHandler())
    .use(httpCors());
