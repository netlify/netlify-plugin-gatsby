// @ts-check
const createRequestObject = require("./createRequestObject");
const createResponseObject = require("./createResponseObject");
const gatsbyFunction = require("./gatsbyFunction");

exports.handler = async function handler(event, context) {
  const req = createRequestObject({ event, context });
  let functions;
  try {
    functions = require("../../../.cache/functions/manifest.json");
  } catch (e) {
    return {
      statusCode: 404,
    };
  }

  return new Promise((onResEnd) => {
    const res = createResponseObject({ onResEnd });
    try {
      gatsbyFunction(req, res, functions);
    } catch (e) {
      console.error(e);
      return { statusCode: 500 };
    }
  });
};
